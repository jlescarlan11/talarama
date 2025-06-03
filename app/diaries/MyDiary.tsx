import { useState } from 'react';

type DiaryEntry = {
  id: number;
  date: string;
  title: string;
  content: string;
  isFavorite: boolean;
};

const MyDiary = () => {
  // Sample data for diary entries (from your image)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([
    {
      id: 1,
      date: 'June 2025',
      title: 'Little Women',
      content: 'Walking it the second time was week',
      isFavorite: true,
    },
    {
      id: 2,
      date: 'May 2025',
      title: 'Little Women',
      content: 'It was a remarkable movie I totally missed to face on additional and how girls are capable more...',
      isFavorite: false,
    },
    {
      id: 3,
      date: 'January 2025',
      title: 'Flow',
      content: 'If two very cute visuals I love cats too.',
      isFavorite: true,
    },
  ]);

  const toggleFavorite = (id: number) => {
    setDiaryEntries(entries =>
      entries.map(entry =>
        entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
      )
    );
  };

  return (
    <div className="space-y-4 p-4">
      {diaryEntries.map((entry) => (
        <div key={entry.id} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title">{entry.title}</h2>
                <p className="text-gray-500 text-sm">{entry.date}</p>
              </div>
              <button
                onClick={() => toggleFavorite(entry.id)}
                className={`btn btn-sm btn-ghost ${entry.isFavorite ? 'text-yellow-500' : ''}`}
              >
                {entry.isFavorite ? '★' : '☆'}
              </button>
            </div>
            <p className="mt-2">{entry.content}</p>
            {entry.isFavorite && (
              <div className="badge badge-warning mt-2">Favorite</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyDiary;