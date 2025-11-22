import type React from 'react'

const FramesTabMinimal: React.FC<any> = () => {
  return (
    <div className="w-full h-full bg-zinc-950 text-white p-8">
      <h1 className="text-2xl">Timeline Tab</h1>
      <p>This is a minimal timeline tab to test for circular dependencies.</p>
    </div>
  )
}

export default FramesTabMinimal
