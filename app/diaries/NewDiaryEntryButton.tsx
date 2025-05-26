import { Link } from "@/app/components";

const NewDiaryEntryButton = () => {
  return (
    <div className="mb-4">
      <button className="btn btn-primary">
        <Link href="diaries/new"> New Diary</Link>
      </button>
    </div>
  );
};

export default NewDiaryEntryButton;
