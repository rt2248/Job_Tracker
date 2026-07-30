export default function GridLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none
        bg-[linear-gradient(rgba(99,102,241,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.18)_1px,transparent_1px)]
        bg-[length:80px_80px]
        [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]
        [-webkit-mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]"
    />
  )
}
