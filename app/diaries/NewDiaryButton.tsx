import { Link } from "@/app/components";

const NewDiaryButton = () => {
  return (
    <div className="mb-4">
      <button className="btn btn-primary">
        <Link href="diaries/new"> New Diary</Link>
      </button>
    </div>
  );
};

export default NewDiaryButton;
