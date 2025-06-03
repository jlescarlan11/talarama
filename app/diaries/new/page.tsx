import prisma from "@/prisma/client";
import DiaryForm from "../_components/DiaryForm";

const DiaryPage = async () => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
  });

  return <DiaryForm movies={movies} />;
};

export default DiaryPage;
