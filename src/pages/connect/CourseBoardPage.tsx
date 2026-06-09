import { useParams } from 'react-router-dom';
import BoardFeed from '@/components/BoardFeed';

const CourseBoardPage = () => {
  const { boardType } = useParams<{ boardType: string }>();
  return <BoardFeed boardType={boardType} scope="course" backTo="/connect/course" backLabel="Course Connect" />;
};

export default CourseBoardPage;
