import React from 'react';
import Select, { StylesConfig } from 'react-select';

interface OptionType {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: OptionType[];
  value: string | number;
  onChange: (e: { target: { name?: string; value: string } }) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isClearable?: boolean;
}

const customStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: state.isDisabled ? '#f1f5f9' : '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: '0.5rem',
    minHeight: '44px',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    '&:hover': {
      borderColor: state.isDisabled ? '#cbd5e1' : '#94a3b8'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e0e7ff' : '#fff',
    color: state.isSelected ? '#fff' : '#334155',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#4f46e5',
      color: '#fff'
    }
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: state.isDisabled ? '#94a3b8' : '#475569',
    fontWeight: '600',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#94a3b8',
    fontWeight: '600',
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  })
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  name,
  placeholder = 'Select an option...',
  disabled = false,
  isClearable = false
}) => {
  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || null;

  const handleChange = (selected: OptionType | null) => {
    onChange({
      target: {
        name,
        value: selected ? selected.value : ''
      }
    });
  };

  return (
    <div className="w-full">
      <Select
        options={options}
        value={selectedOption}
        onChange={handleChange}
        styles={customStyles}
        isDisabled={disabled}
        placeholder={placeholder}
        isClearable={isClearable}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
};

export default SearchableSelect;
