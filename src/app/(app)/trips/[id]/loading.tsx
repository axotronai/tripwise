export default function TripLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">

      {/* Trip header skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1">
            <div className="h-7 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
            <div className="flex gap-2 mt-3">
              {[1,2,3,4].map(i => <div key={i} className="h-5 w-20 bg-gray-100 rounded-full" />)}
            </div>
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-9 w-20 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-gray-100 rounded-full">
          <div className="h-full w-1/3 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-9 rounded-lg ${i === 1 ? 'w-28 bg-blue-100' : 'w-24 bg-gray-100'} shrink-0`} />
        ))}
      </div>

      {/* Day columns skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(day => (
          <div key={day} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
            {[1,2,3].map(act => (
              <div key={act} className="border border-gray-100 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-gray-200 rounded-lg" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
            <div className="h-8 w-full bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
