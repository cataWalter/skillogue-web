import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar Skeleton */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-800 p-4 hidden md:block">
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Area Skeleton */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 space-y-6 p-4">
           {[1, 2, 3].map((i) => (
             <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
               <Skeleton className="h-16 w-1/2 rounded-2xl" />
             </div>
           ))}
        </div>
        <Skeleton className="h-14 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}
