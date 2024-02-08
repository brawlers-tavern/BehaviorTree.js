import { RUNNING } from './constants';
import Node from './Node';
import { AbortCondition, Blackboard, RunConfig, RunResult } from './types';
import BehaviorTree from './BehaviorTree';

export default class Abort extends Node {
  nodeType = 'Abort';
  abortCondition: AbortCondition = (blackboard: Blackboard) => {return false};
  abortId: string = "";

  start(blackboard: Blackboard) {
    const tree = blackboard.tree as BehaviorTree
    if (this.blueprint.abortCondition) this.abortCondition = this.blueprint.abortCondition
    this.abortId = this.blueprint.abortId ? this.blueprint.abortId : "";
    tree.registerAbortCondition(this.abortId, this.abortCondition);
  }

  run(blackboard: Blackboard, { introspector, rerun = false, registryLookUp = (x) => x as Node, ...config }: RunConfig = {}): RunResult {
    this.start(blackboard);
    if (!rerun) this.blueprint.start(blackboard);
    const result = this.blueprint.run(blackboard, { ...config, rerun, registryLookUp });
    if (result !== RUNNING) {
      this.blueprint.end(blackboard);
    }
    if (introspector) {
      introspector.push(this, result, blackboard);
    }
    return result;
  }
}
