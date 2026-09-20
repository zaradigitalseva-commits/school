import type { School } from '@/firebase/types';

type Props = {
  school: School;
  rollNumber: string;
  setRollNumber: (value: string) => void;
  resultSearchLoading: boolean;
  publicResults: any[];
  searchPublicResults: () => void;
};

export default function ResultsSection({ school, rollNumber, setRollNumber, resultSearchLoading, publicResults, searchPublicResults }: Props) {
  return (<section id="results" className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 shadow-2xl sm:p-10">
            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-wider text-blue-600">
                Student Results
              </span>
              <h2 className="mt-2 text-3xl font-black text-gray-900">
                Check Result
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {school.name} का Roll Number डालकर result देखें।
              </p>
            </div>

            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void searchPublicResults();
              }}
            >
              <input
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
                placeholder="Enter Roll Number"
                className="min-w-0 flex-1 rounded-xl border-2 border-blue-100 bg-white px-4 py-3 font-bold outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={resultSearchLoading || !rollNumber.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-black text-white shadow-[0_5px_0_rgb(67,56,202)] disabled:opacity-50"
              >
                {resultSearchLoading ? 'Searching...' : '🔎 Check Result'}
              </button>
            </form>

            {publicResults.length > 0 && (
              <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-lg">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-black">Student</th>
                      <th className="px-4 py-3 font-black">Class</th>
                      <th className="px-4 py-3 font-black">Exam</th>
                      <th className="px-4 py-3 font-black">Subject</th>
                      <th className="px-4 py-3 font-black">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicResults.map((result) => (
                      <tr key={result.id} className="border-t">
                        <td className="px-4 py-3 font-bold">{result.studentName || '-'}</td>
                        <td className="px-4 py-3">{result.className || '-'}</td>
                        <td className="px-4 py-3">{result.exam || '-'}</td>
                        <td className="px-4 py-3">{result.subject || '-'}</td>
                        <td className="px-4 py-3 font-black">{result.marks ?? result.score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!resultSearchLoading &&
              rollNumber.trim() &&
              publicResults.length === 0 && (
                <p className="mt-5 rounded-xl bg-white p-4 text-center font-bold text-gray-500">
                  इस Roll Number का result नहीं मिला।
                </p>
              )}
          </div>
        </div>
      </section>
  );
}
