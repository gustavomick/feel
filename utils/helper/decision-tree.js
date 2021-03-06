/*
*
*  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
*  Bangalore, India. All Rights Reserved.
*
*/


const FEEL = require('../../dist/feel').parse;
const { getOrderedOutput, hitPolicyPass } = require('./hit-policy.js');

function Node(data, type) {
  this.data = data;
  this.type = type;
  this.children = {};
}

function Tree(data) {
  const node = new Node(data, 'Root');
  this.root = node;
}

const createDecisionTree = (dTable) => {
  const ruleTree = new Tree('Rule');
  const root = ruleTree.root;
  const classNodeList = dTable.inputExpressionList;
  const numOfConditions = classNodeList.length;
  const outputNodeList = dTable.outputs;
  const ruleList = dTable.ruleList;
  const outputSet = {};

  root.hitPolicy = dTable.hitPolicy;
  if (root.hitPolicy === 'P' || root.hitPolicy === 'O') {
    root.priorityList = dTable.priorityList;
  }
  if (dTable.context !== null) {
    root.context = new Node(dTable.context, 'Context');
    root.context.ast = FEEL(root.context.data);
    root.context.children = null;
  } else {
    root.context = dTable.context;
  }
  classNodeList.forEach((classValue) => {
    const node = new Node(classValue, 'Class');
    node.ast = null;
    root.children[classValue] = node;
  });

  ruleList.forEach((row, rowIndex) => {
    const outputValue = {};
    const index = rowIndex + 1;
    const data = `Rule${index}`;
    const sentinelNode = new Node(data, 'Sentinel');
    sentinelNode.children = null;
    row.forEach((cellValue, colIndex) => {
      if (colIndex < numOfConditions) {
        const node = root.children[classNodeList[colIndex]].children[cellValue] || new Node(cellValue, 'Value');
        node.ast = node.ast || FEEL(cellValue);
        node.children[data] = sentinelNode;
        root.children[classNodeList[colIndex]].children[cellValue] = root.children[classNodeList[colIndex]].children[cellValue] || node;
      } else {
        const node = new Node(cellValue);
        node.ast = FEEL(cellValue);
        node.children = null;
        outputValue[outputNodeList[colIndex - numOfConditions]] = node;
      }
    });
    outputSet[data] = outputValue;
  });

  root.outputSet = outputSet;
  return root;
};

const prepareOutput = (outputSet, output, payload) =>
new Promise((resolve, reject) => {
  Promise.all(output.map((i) => {
    const keys = Object.keys(outputSet[i]);
      return new Promise((resolve, reject) => { // eslint-disable-line
        Promise.all(keys.map(k => outputSet[i][k].ast.build(payload))).then((results) => {
          resolve(results.reduce((res, val, j) => {
            const obj = {};
            obj[keys[j]] = val;
            return Object.assign({}, obj, res);
          }, {}));
        }).catch(err => reject(err));
      });
  })).then(results =>
        resolve(results)).catch(err => reject(err));
});

const resolveConflictRules = (root, payload, rules) => {
  let output = [];
  const rootChildren = root.children;
  const classArr = Object.keys(rootChildren);

  classArr.every((classNode, i) => {
    const valueKeys = Object.keys(rootChildren[classNode].children);
    const matchKeys = rules[i];
    let arr = [];
    if (matchKeys.length === 0) {
      output = [];
      return false;
    }
    valueKeys.forEach((valKey, j) => {
      if (matchKeys.indexOf(j) > -1) {
        arr = arr.concat(Object.keys(rootChildren[classNode].children[valKey].children));
      }
    });

    arr = arr.filter((item, index) => arr.indexOf(item) === index);
    output = output.length > 0 ? arr.filter(d => output.indexOf(d) > -1) : arr;
    return true;
  });

  if (output.length > 0) {
    return prepareOutput(root.outputSet, getOrderedOutput(root, output), payload);
  }
  return Promise.resolve([]);
};

const traverseDecisionTreeUtil = (root, payload) => {
  const classArr = Object.keys(root.children);
  return new Promise((resolve, reject) => {
    Promise.all(classArr.map((classKey) => {
      const node = root.children[classKey];
      const sentinelKeys = Object.keys(node.children);
      return new Promise((resolve, reject) => {
        Promise.all(sentinelKeys.map(key => node.children[key].ast.build(payload, 'input'))).then((results) => {
          let res = results.map((f, i) => ({ value: f(payload[classKey]), index: i })).filter(d => d.value === true);
          res = res.map(obj => obj.index);
          resolve(res);
        }).catch(err => reject(err));
      });
    })).then(results =>
        resolveConflictRules(root, payload, results).then(results =>
            resolve(results))).catch(err => reject(err));
  });
};

const prepareContext = (root, payload) => {
  if (root.context !== null) {
    return root.context.ast.build(payload);
  }
  return Promise.resolve(payload);
};

const traverseDecisionTree = (root, payload, cb) => {
  prepareContext(root, payload).then((context) => {
    const ctx = Object.assign({}, payload, context);
    traverseDecisionTreeUtil(root, ctx).then((results) => {
      hitPolicyPass(root.hitPolicy, results, cb);
    }).catch(err => cb(err, null));
  }).catch(err => cb(err, null));
};

module.exports = {
  createTree: createDecisionTree,
  traverseTree: traverseDecisionTree,
};
