import React from "react";

const ShimmerCard = () => (
  <div className="relative">
    <div className="aspect-[9/13.5] w-full rounded-xl overflow-hidden bg-[#12161e] relative">
      {/* Shimmer sweep */}
      <div className="absolute inset-0 shimmer-sweep" />
    </div>
    <div className="mt-2 space-y-1.5 px-0.5">
      <div className="h-3 bg-[#12161e] rounded-full w-4/5 overflow-hidden relative">
        <div className="absolute inset-0 shimmer-sweep" />
      </div>
      <div className="h-2.5 bg-[#12161e] rounded-full w-2/5 overflow-hidden relative">
        <div className="absolute inset-0 shimmer-sweep" style={{ animationDelay: '0.1s' }} />
      </div>
    </div>
    {/* Top badge placeholder */}
    <div className="absolute top-2 left-2 w-10 h-4 rounded-full bg-[#12161e] overflow-hidden">
      <div className="absolute inset-0 shimmer-sweep" style={{ animationDelay: '0.2s' }} />
    </div>
  </div>
);

const MovieCardSkeleton = () => {
  return (
    <>
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(132, 204, 22, 0.06) 50%,
            rgba(255, 255, 255, 0.04) 55%,
            transparent 65%
          );
          animation: shimmerSweep 1.8s infinite ease-in-out;
        }
      `}</style>
      <div className="grid gap-x-2 gap-y-6 grid-cols-3 md:grid-cols-4 bsmmd:grid-cols-5 lg:grid-cols-6 blgxl:grid-cols-7 xl:grid-cols-8">
        {[...Array(19)].map((_, index) => (
          <ShimmerCard key={index} />
        ))}
      </div>
    </>
  );
};

export default MovieCardSkeleton;
