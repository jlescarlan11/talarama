import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonProps {
  count?: number;
  height?: number | string;
  width?: number | string;
  circle?: boolean;
  className?: string;
  containerClassName?: string;
  inline?: boolean;
  style?: React.CSSProperties;
}

const SkeletonComponent: React.FC<SkeletonProps> = ({
  count = 1,
  height,
  width,
  circle = false,
  className,
  containerClassName,
  inline = false,
  style,
}) => {
  return (
    <Skeleton
      count={count}
      height={height}
      width={width}
      circle={circle}
      className={className}
      containerClassName={containerClassName}
      inline={inline}
      style={style}
      baseColor="#e5e7eb"
      highlightColor="#f3f4f6"
    />
  );
};

// Common skeleton patterns
export const TableRowSkeleton = () => (
  <tr>
    <td><SkeletonComponent height={20} /></td>
    <td><SkeletonComponent height={20} /></td>
    <td><SkeletonComponent height={20} /></td>
    <td><SkeletonComponent height={20} /></td>
  </tr>
);

export const CardSkeleton = () => (
  <div className="animate-pulse">
    <SkeletonComponent height={200} className="rounded-lg mb-3" />
    <div className="space-y-2">
      <SkeletonComponent height={20} width="75%" />
      <SkeletonComponent height={16} width="50%" />
      <SkeletonComponent height={16} width="66%" />
    </div>
  </div>
);

export const FormFieldSkeleton = () => (
  <div className="space-y-2">
    <SkeletonComponent height={16} width={100} />
    <SkeletonComponent height={40} />
  </div>
);

export const AvatarSkeleton = () => (
  <SkeletonComponent circle height={40} width={40} />
);

export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonComponent key={i} height={16} width={i === lines - 1 ? "75%" : "100%"} />
    ))}
  </div>
);

export default SkeletonComponent;
