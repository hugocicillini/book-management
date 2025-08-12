import { Spinner as BsSpinner } from 'react-bootstrap';

const Spinner = ({ size }) => {
  return (
    <BsSpinner
      animation="border"
      variant="secondary"
      size={size ? size : 'lg'}
    />
  );
};

export default Spinner;
