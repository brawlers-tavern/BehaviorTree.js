import BehaviorTree from '../BehaviorTree';
import { FAILURE } from '../constants';
import Decorator from '../Decorator';
import { Blackboard, DecoratorConfig, RunCallback, Status } from '../types';

export type AbortDecoratorConfigType = {
  blackboard: Blackboard;
  abortCondition: (blackboard: Blackboard) => Status;
}

export default class AbortDecorator extends Decorator {
  nodeType = 'LoopDecorator';
  public abortId: number | null = null;

  abortRegister(blackboard: Blackboard) {
    const tree = blackboard.actor.behaviorTree as BehaviorTree
    if (!this.config.abortCondition) return
    const abortCondition = this.config.abortCondition
    const result = tree.registerAbortCondition(this.abortId, abortCondition);
    // If null, then the abort condition was already registered otherwise returns current abortId or the new one
    this.abortId = result ? result : this.abortId;
  }

  abortUnregister(blackboard: Blackboard) {
    const tree = blackboard.actor.behaviorTree as BehaviorTree
    if (this.abortId === null) return;
    tree.unregisterAbortCondition(this.abortId);
  }

  setConfig({ blackboard, abortCondition }:  AbortDecoratorConfigType ) {
    this.config = {
      blackboard,
      abortCondition,
    }
  }

  decorate(run: RunCallback, blackboard: Blackboard, config: DecoratorConfig) {

    let result: Status = FAILURE;
    // Check abort decorator condition result
    const abortCondition = this.config.abortCondition;
    result = abortCondition(blackboard);
    // if fail register abort condition and return FAILURE
    if (result === FAILURE) {
      this.abortRegister(blackboard);
      console.log('AbortDecorator: abortCondition failure, registering abort condition');
      return FAILURE;
    }
    // if not fail unregister abort condition
    console.log('AbortDecorator: success, unregistering abort condition');
    this.abortUnregister(blackboard);

    // if not fail run the node and return result
    result = run(run, blackboard, config);
    return result;
  }
}
