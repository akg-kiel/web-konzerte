import * as React from 'react';
import { Form as AriaForm, type FormProps as AriaFormProps } from 'react-aria-components';

export type FormProps = AriaFormProps;

const Form = React.forwardRef<HTMLFormElement, FormProps>((props, ref) => (
  <AriaForm ref={ref} validationBehavior="native" {...props} />
));
Form.displayName = 'Form';

export { Form };
