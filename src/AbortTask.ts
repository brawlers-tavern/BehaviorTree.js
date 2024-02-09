import { FAILURE, RUNNING } from './constants';
import Node from './Node';
import { Blackboard, RunConfig, RunResult } from './types';
import BehaviorTree from './BehaviorTree';

export default class AbortTask extends Node {
  nodeType = 'Abort';

  abortRegister(blackboard: Blackboard) {
    const tree = blackboard.actor.behaviorTree as BehaviorTree
    if (!this.blueprint.abortCondition) return
    const abortCondition = this.blueprint.abortCondition
    const abortId = this.blueprint.abortId ? this.blueprint.abortId : "";
    tree.registerAbortCondition(abortId, abortCondition);
  }

  abortUnregister(blackboard: Blackboard) {
    const tree = blackboard.actor.behaviorTree as BehaviorTree
    if (!this.blueprint.abortCondition) return
    const abortId = this.blueprint.abortId ? this.blueprint.abortId : "";
    tree.unregisterAbortCondition(abortId);
  }

  run(blackboard: Blackboard, { introspector, rerun = false, registryLookUp = (x) => x as Node, ...config }: RunConfig = {}): RunResult {
    if (!rerun) this.blueprint.start(blackboard);
    const result = this.blueprint.run(blackboard, { ...config, rerun, registryLookUp });
    if (result !== RUNNING) {
      this.blueprint.end(blackboard);
    }
    if (introspector) {
      introspector.push(this, result, blackboard);
    }
    if (result === FAILURE) {
      this.abortRegister(blackboard);
    } else {
      this.abortUnregister(blackboard);
    }

    return result;
  }
}
