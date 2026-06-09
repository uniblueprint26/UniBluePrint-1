import { useParams } from 'react-router-dom';
import BoardFeed from '@/components/BoardFeed';

const CampusBoardPage = () => {
  const { boardType } = useParams<{ boardType: string }>();
  return <BoardFeed boardType={boardType} scope="campus" backTo="/campus" backLabel="Campus Connect" />;
};

export default CampusBoardPage;
