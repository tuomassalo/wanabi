import React from 'react';

type TestComponentProps = {
  name: string,
  foo: string,
  num:number
}

const TestComponent = (props:TestComponentProps) => {
  return (
    <div className="TestComponent">
      TEST {props.name}
    </div>
  );
}

export default TestComponent;
