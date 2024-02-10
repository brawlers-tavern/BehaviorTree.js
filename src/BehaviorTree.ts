import { isRunning } from './helper';
import Node from './Node';
import Task from './Task';
import { Blackboard, NodeOrFunction, NodeOrRegistration, Status, StatusWithState, StepParameter } from './types';

export type NodeRegistry = Record<string, Node>;

let registry: NodeRegistry = {};

export function getRegistry() {
  return registry;
}

export function registryLookUp(node: string | Node) {
  if (typeof node === 'string') {
    const lookedUpNode = registry[node];
    if (!lookedUpNode) {
      throw new Error(`No node with name ${node} registered.`);
    }
    return lookedUpNode;
  }
  return node;
}

export default class BehaviorTree {
  tree: NodeOrRegistration;
  blackboard: Blackboard;
  lastResult?: Status | StatusWithState;
  abortId = 0;

  // Create a map of conditions to check for aborting the tree
  private _abortConditions: Map<number, (blackboard: Blackboard) => boolean>;

  public registerAbortCondition(id: number | null, condition: (blackboard: Blackboard) => boolean) {
    if (id && this._abortConditions.has(id)) {
      // console.info(`Abort condition with id ${id} already exists.`);
      return null
    }
    // Assign new id if none is provided
    const abortId = id ? id : this.abortId++;
    this._abortConditions.set(abortId, condition);
    return abortId;
  }

  public unregisterAbortCondition(id: number | null): void {
    if (id === null) return
    this._abortConditions.delete(id);
  }

  private _checkAndHandleAbort(blackboard: Blackboard): boolean {
    for (const [key,condition] of this._abortConditions) {
      if (condition(blackboard)) {
        this._abortConditions.clear(); // Clear conditions
        return true; // Abort was triggered
      }
    }
    return false; // No abort condition met
  }

  constructor({ tree, blackboard }: { tree: NodeOrRegistration; blackboard: Blackboard }) {
    this.tree = tree;
    this.blackboard = blackboard;
    this.lastResult = undefined;
    this._abortConditions = new Map<number, (blackboard: Blackboard) => boolean>();
  }

  step({ introspector }: StepParameter = {}) {
    let lastRun = this.lastResult && typeof this.lastResult === 'object' ? this.lastResult : undefined;
    let rerun = isRunning(this.lastResult);
    if (rerun && this._checkAndHandleAbort(this.blackboard)) {
      lastRun = undefined;
      rerun = false;
      this.lastResult = undefined;
      return
    }
    if (introspector) {
      introspector.start(this);
    }
    this.lastResult = registryLookUp(this.tree).run(this.blackboard, {
      lastRun,
      introspector,
      rerun,
      registryLookUp
    });
    if (introspector) {
      introspector.end();
    }
  }

  static register(name: string, node: NodeOrFunction) {
    registry[name] = typeof node === 'function' ? new Task({ name, run: node }) : node;
  }

  static cleanRegistry() {
    registry = {};
  }
}
