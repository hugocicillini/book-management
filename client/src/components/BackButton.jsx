import { Link } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';

const BackButton = ({ destination = '/' }) => {
  return (
    <div className='flex'>
      <Link to={destination} className='bg-slate-800 px-4 py-1 rounded-full w-fit '>
        <BsArrowLeft color='white' size={24} />
      </Link>
    </div>
  )
}

export default BackButton;