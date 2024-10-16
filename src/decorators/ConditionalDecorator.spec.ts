// src/decorators/ConditionalDecorator.test.ts
import ConditionalDecorator from './ConditionalDecorator';
import { FAILURE, RUNNING, SUCCESS } from '../constants';
import { Blackboard } from '../types';

describe('ConditionalDecorator', () => {
  let decorator: ConditionalDecorator;
  let mockBlackboard: Blackboard;
  let mockRun: jest.Mock;

  beforeEach(() => {
    decorator = new ConditionalDecorator();
    mockBlackboard = {
      actor: {
        behaviorTree: {
          registerAbortCondition: jest.fn(),
          unregisterAbortCondition: jest.fn(),
        },
      },
    } as unknown as Blackboard;

    mockRun = jest.fn();
  });

  test('should register abort condition', () => {
    decorator.blueprint = { 
      abortCondition: jest.fn(), 
      abortLower: true,
      end: jest.fn(),
      run: jest.fn(),
      start: jest.fn()
    };
    decorator.abortRegister(mockBlackboard);
    expect(mockBlackboard.actor.behaviorTree.registerAbortCondition).toHaveBeenCalled();
  });

  test('should unregister abort condition', () => {
    decorator.abortId = 1;
    decorator.abortUnregister(mockBlackboard);
    expect(mockBlackboard.actor.behaviorTree.unregisterAbortCondition).toHaveBeenCalledWith(1);
  });

  test('should return FAILURE when abort condition fails', () => {
    decorator.blueprint = { 
      abortCondition: () => FAILURE, 
      abortLower: true,
      end: jest.fn(),
      run: jest.fn(),
      start: jest.fn()
    };
    const result = decorator.decorate(mockRun, mockBlackboard);
    expect(result).toBe(FAILURE);
  });

  test('should run the node and return result', () => {
    mockRun.mockReturnValue(RUNNING);
    decorator.blueprint = { 
      abortCondition: () => SUCCESS, 
      abortSelf: true,
      end: jest.fn(),
      run: jest.fn(),
      start: jest.fn()
    };
    const result = decorator.decorate(mockRun, mockBlackboard);
    expect(result).toBe(RUNNING);
    expect(mockBlackboard.actor.behaviorTree.registerAbortCondition).toHaveBeenCalledWith(null,expect.any(Function),true);
  });
});