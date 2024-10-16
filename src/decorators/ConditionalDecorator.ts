import BehaviorTree from '../BehaviorTree';
import { FAILURE } from '../constants';
import Decorator from '../Decorator';
import { isRunning } from '../helper';
import { Blackboard, RunCallback, Status } from '../types';

export default class ConditionalDecorator extends Decorator {
  nodeType = 'ConditionalDecorator';
  public abortId: number | null = null;

  abortRegister(blackboard: Blackboard, invert = false) {
    const tree = blackboard.actor.behaviorTree as BehaviorTree
    if (!this.blueprint.abortCondition) return
    const abortCondition = this.blueprint.abortCondition
    const result = tree.registerAbortCondition(this.abortId, abortCondition, invert);
    // If null, then the abort condition was already registered otherwise returns current abortId or the new one
    this.abortId = result ? result : this.abortId;
  }

  abortUnregister(blackboard: Blackboard) {
    const tree = blackboard.actor.behaviorTree as BehaviorTree
    if (this.abortId === null) return;
    tree.unregisterAbortCondition(this.abortId);
  }

  decorate(run: RunCallback, blackboard: Blackboard) {
    let result: Status = FAILURE;
    // Check abort decorator condition result
    const abortCondition = this.blueprint.abortCondition ? this.blueprint.abortCondition : () => FAILURE;
    result = abortCondition(blackboard);

    if (result == FAILURE && this.blueprint.abortLower) {
      this.abortRegister(blackboard);
      return FAILURE;
    }
    // if not fail unregister abort condition
    this.abortUnregister(blackboard);

    // if not fail run the node and return result
    result = run();
    // if result is running, register inverted abort condition
    if (isRunning(result) && this.blueprint.abortSelf) {
      this.abortRegister(blackboard, true);
      // console.log('ConditionalDecorator: child running, registering inverted abort condition');
    }
    return result;
  }
}
