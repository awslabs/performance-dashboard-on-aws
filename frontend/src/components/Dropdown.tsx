import React from "react";

interface Props {
  id: string;
  name: string;
  label: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  defaultValue?: string;
  value?: string;
  register?: Function;
  hint?: string;
  error?: string;
  required?: boolean;
  onChange?: Function;
}

function Dropdown(props: Props) {
  let formGroupClassName = "usa-form-group";
  if (props.error) {
    formGroupClassName += " usa-form-group--error";
  }

  const handleChange = (event: React.FormEvent<HTMLSelectElement>) => {
    if (props.onChange) {
      props.onChange(event);
    }
  };

  return (
    <div className={formGroupClassName}>
      <label htmlFor={props.id} className="usa-label text-bold">
        {props.label}
      </label>
      <div className="usa-hint" id="event-date-start-hint">
        {props.hint}
      </div>
      {props.error && (
        <span
          className="usa-error-message"
          id="input-error-message"
          role="alert"
        >
          {props.error}
        </span>
      )}
      <select
        id={props.id}
        defaultValue={props.defaultValue}
        value={props.value}
        ref={props.register && props.register({ required: props.required })}
        name={props.name}
        onChange={handleChange}
        className="usa-select"
      >
        {props.options.map((option) => {
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default Dropdown;
