import React from "react";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

export default function MoviesAndSeriesSections(props) {
  const filterOptions = [
    { name: "Latest", value: "updated_on" },
    { name: "Top Rated", value: "rating" },
    { name: "New", value: "release_year" },
  ];
  
  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className="mt-20 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-1 h-8 bg-red-600 rounded-full mr-4"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {props.sectionTitle}
            </h1>
          </div>
          
          {(props.dataType === "movies" || props.dataType === "series") && (
            <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-md rounded-2xl p-2 border border-gray-800">
              {filterOptions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    props.setMovieFilterVal(item.value);
                    props.setMovieFilter(item.value);
                  }}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out
                    ${item.value === props.movieFilterVal
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        {!props.isMovieDataLoading ? (
          <div className="w-full">
            <div className="grid gap-x-2 gap-y-6 grid-cols-3 md:grid-cols-4 bsmmd:grid-cols-5 lg:grid-cols-6 blgxl:grid-cols-7 xl:grid-cols-8">
              {props.movieData.map((movie, index) => (
                <div 
                  key={index} 
                  className="transform transition-all duration-300 hover:scale-105 hover:z-10 group"
                >
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <MovieCardSkeleton />
        )}
      </div>
    </div>
  );
}
