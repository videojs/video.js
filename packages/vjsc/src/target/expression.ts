import { isObject, isString } from '@videojs/utils/predicate';

import {
  TARGET_EXPRESSION,
  TARGET_SPREAD,
  TARGET_WITH_PROPS,
  type TargetBinding,
  type TargetCode,
  type TargetExpression,
  type TargetExpressionNode,
  type TargetWithProps,
} from './definition';

export function createTargetCode(): TargetCode {
  return {
    param: createBinding,
    fn(parameters, output) {
      return createExpression({ kind: 'function', parameters: parameters.map(readBinding), output });
    },
    when(test, output) {
      return createExpression({ kind: 'conditional', test: readExpression(test), output });
    },
    withProps(children, props) {
      return {
        [TARGET_WITH_PROPS]: true,
        children,
        props: isTargetExpression(props) ? readExpression(props) : props,
      };
    },
  };
}

export function isTargetExpression(value: unknown): value is TargetExpression {
  return Boolean(isObject(value) && (value as Partial<TargetExpression>)[TARGET_EXPRESSION]);
}

export function isTargetWithProps(value: unknown): value is TargetWithProps {
  return Boolean(isObject(value) && (value as Partial<TargetWithProps>)[TARGET_WITH_PROPS] === true);
}

export function readTargetExpression(value: TargetExpression): TargetExpressionNode {
  return value[TARGET_EXPRESSION];
}

function createBinding<Value = unknown>(name: string): TargetBinding<Value> {
  if (!/^[$A-Z_a-z][$\w]*$/.test(name)) {
    throw new Error(`vjsc/target: generated parameter \`${name}\` is not a valid identifier.`);
  }

  return createBindingPath(name) as TargetBinding<Value>;
}

function createBindingPath(code: string): TargetBinding {
  const expression = createExpression({ kind: 'reference', code });

  return new Proxy(expression as TargetBinding, {
    get(target, property) {
      if (property === TARGET_EXPRESSION) return target[TARGET_EXPRESSION];

      if (property === TARGET_SPREAD) return expression;

      if (isString(property)) return createBindingPath(`${code}.${property}`);

      return (target as TargetBinding & Readonly<Record<PropertyKey, unknown>>)[property];
    },
    ownKeys() {
      return [TARGET_SPREAD];
    },
    getOwnPropertyDescriptor(_target, property) {
      return property === TARGET_SPREAD
        ? { configurable: true, enumerable: true, value: expression, writable: false }
        : undefined;
    },
  });
}

function createExpression(expression: TargetExpressionNode): TargetExpression {
  return { [TARGET_EXPRESSION]: expression };
}

function readExpression(expression: TargetExpression): TargetExpressionNode {
  return expression[TARGET_EXPRESSION];
}

function readBinding(binding: TargetBinding): string {
  const expression = readExpression(binding);

  if (expression.kind !== 'reference' || expression.code.includes('.')) {
    throw new Error('vjsc/target: generated function parameters must be direct bindings.');
  }

  return expression.code;
}
