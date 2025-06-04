import { Link } from "@/app/components";

const NewDiaryEntryButton = () => {
  return (
    <Link href="/diaries/new">
      <button className="btn btn-primary">New Diary</button>
    </Link>
  );
};

export default NewDiaryEntryButton;
