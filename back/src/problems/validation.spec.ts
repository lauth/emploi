import { plainToInstance, Type } from 'class-transformer';
import { IsIn, MaxLength, ValidateNested, validateSync } from 'class-validator';
import { toInvalidParams } from './validation.js';

class Child {
  @IsIn(['a', 'b'])
  kind: string;
}

class Parent {
  @MaxLength(3)
  'odd/name~': string;

  @ValidateNested({ each: true })
  @Type(() => Child)
  children: Child[];
}

describe('toInvalidParams', () => {
  const errors = validateSync(
    plainToInstance(Parent, {
      'odd/name~': 'toolong',
      children: [{ kind: 'a' }, { kind: 'z' }],
    }),
  );

  it('gives body values as JSON Pointers, nested and escaped, with hints', () => {
    expect(toInvalidParams(errors, 'body')).toEqual([
      {
        in: 'body',
        name: '/odd~1name~0',
        code: 'maxLength',
        detail: 'odd/name~ must be shorter than or equal to 3 characters',
        maxLength: 3,
      },
      {
        in: 'body',
        name: '/children/1/kind',
        code: 'isIn',
        detail: 'kind must be one of the following values: a, b',
        allowed: ['a', 'b'],
      },
    ]);
  });

  it('gives query values by parameter name', () => {
    expect(toInvalidParams(errors, 'query').map(({ name }) => name)).toEqual([
      'odd/name~',
      'children.1.kind',
    ]);
  });
});
