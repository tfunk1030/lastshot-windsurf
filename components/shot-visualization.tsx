'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Slider } from './ui/slider'

interface ShotVisualizationProps {
  distance?: number
  windSpeed?: number
  windDirection?: number
}

const PADDING = 40

export default function ShotVisualization({
  distance = 220,
  windSpeed = 12,
  windDirection = 45
}: ShotVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [params, setParams] = useState({
    distance,
    windSpeed,
    windDirection
  })

  // Calculate lateral offset based on wind conditions and distance
  const calculateLateralOffset = (distance: number, windSpeed: number, windDirection: number): number => {
    // Convert wind direction to radians
    const windAngle = windDirection * Math.PI / 180
    
    // Calculate wind effect (stronger effect with higher wind speed and longer distance)
    // Wind effect increases non-linearly with distance due to longer exposure time
    // Use cosine to allow for both positive and negative offsets based on wind direction
    const windEffect = Math.cos(windAngle) * windSpeed * Math.pow(distance / 200, 1.5)
    
    // Scale the effect (adjust this multiplier to control the overall wind influence)
    return windEffect * 0.4 // Scaled to give reasonable offsets (-20 to +20 yards)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Prevent default touch actions on canvas
    canvas.style.touchAction = 'none'

    // Handle touch events
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault()
      // Touch handling logic here
    }

    canvas.addEventListener('touchstart', handleTouch, { passive: false })
    canvas.addEventListener('touchmove', handleTouch, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', handleTouch)
      canvas.removeEventListener('touchmove', handleTouch)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate lateral offset based on wind and distance
    const lateralOffset = calculateLateralOffset(params.distance, params.windSpeed, params.windDirection)

    // Calculate scales
    const xRange = 40 // -20 to +20 yards
    const yardToPixelX = (canvas.width - (2 * PADDING)) / xRange
    const yardToPixelY = (canvas.height - (2 * PADDING)) / params.distance

    // Set origin to bottom center of canvas
    const originX = canvas.width / 2
    const originY = canvas.height - PADDING

    // Draw grid and axes
    drawGrid(ctx, canvas.width, canvas.height, params.distance, xRange, yardToPixelX, yardToPixelY, originX, originY)

    // Draw wind indicator
    drawWindIndicator(ctx, params.windSpeed, params.windDirection)

    // Draw shot path with calculated lateral offset
    drawShotPath(ctx, originX, originY, params.distance, lateralOffset, yardToPixelX, yardToPixelY)

  }, [params])

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    distance: number,
    xRange: number,
    yardToPixelX: number,
    yardToPixelY: number,
    originX: number,
    originY: number
  ) => {
    // Draw vertical gridlines
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1

    // Draw horizontal gridlines every 20 yards
    for (let y = 0; y <= distance; y += 20) {
      const pixelY = originY - (y * yardToPixelY)
      
      ctx.beginPath()
      ctx.moveTo(PADDING, pixelY)
      ctx.lineTo(width - PADDING, pixelY)
      ctx.stroke()

      // Add yard markers
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '10px Inter'
      ctx.textAlign = 'right'
      ctx.fillText(`${y}`, PADDING - 5, pixelY + 4)
    }

    // Draw vertical gridlines every 5 yards
    for (let x = -xRange/2; x <= xRange/2; x += 5) {
      const pixelX = originX + (x * yardToPixelX)
      
      ctx.beginPath()
      ctx.moveTo(pixelX, PADDING)
      ctx.lineTo(pixelX, height - PADDING)
      ctx.stroke()

      // Add offset markers
      if (x !== 0) {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '10px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.abs(x)}`, pixelX, height - PADDING + 15)
      }
    }

    // Draw axes
    ctx.strokeStyle = '#4B5563'
    ctx.lineWidth = 2

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(originX, PADDING)
    ctx.lineTo(originX, height - PADDING)
    ctx.stroke()

    // X-axis
    ctx.beginPath()
    ctx.moveTo(PADDING, originY)
    ctx.lineTo(width - PADDING, originY)
    ctx.stroke()

    // Add labels
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '12px Inter'
    ctx.textAlign = 'center'
    
    // X-axis label
    ctx.fillText('Lateral Offset (yards)', width / 2, height - 10)
    
    // Y-axis label
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Distance (yards)', 0, 0)
    ctx.restore()
  }

  const drawWindIndicator = (
    ctx: CanvasRenderingContext2D,
    windSpeed: number,
    windDirection: number
  ) => {
    const radius = 30
    const x = PADDING + radius + 10
    const y = PADDING + radius + 10

    // Draw wind speed indicator background
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#1F2937'
    ctx.fill()

    // Draw direction arrow
    const angle = (windDirection - 90) * Math.PI / 180 // Adjust for 0° being North
    const arrowLength = radius - 5

    ctx.beginPath()
    ctx.moveTo(
      x + Math.cos(angle) * 5,
      y + Math.sin(angle) * 5
    )
    ctx.lineTo(
      x + Math.cos(angle) * arrowLength,
      y + Math.sin(angle) * arrowLength
    )
    
    ctx.strokeStyle = '#10B981'
    ctx.lineWidth = 2
    ctx.stroke()

    // Add wind speed text
    ctx.fillStyle = '#D1D5DB'
    ctx.font = '12px Inter'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(windSpeed)}`, x, y)
    ctx.font = '10px Inter'
    ctx.fillStyle = '#9CA3AF'
    ctx.fillText('MPH', x, y + 14)
  }

  const drawShotPath = (
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    distance: number,
    lateralOffset: number,
    yardToPixelX: number,
    yardToPixelY: number
  ) => {
    ctx.beginPath()
    ctx.strokeStyle = '#10B981'
    ctx.lineWidth = 2

    // Start from origin
    ctx.moveTo(originX, originY)

    const numPoints = 100;
    let lastX = originX;
    let lastY = originY;

    // Calculate initial velocity based on distance
    // Longer shots have higher initial velocity
    const initialVelocity = distance / 200; // Normalized velocity
    
    // Calculate wind effect strength based on distance
    // Longer shots are more affected by wind as they're in the air longer
    const windEffect = Math.pow(distance / 200, 1.2);

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      
      // Parabolic height curve
      const heightT = 4 * t * (1 - t); // Parabolic curve peaking at t=0.5
      const maxHeight = distance * 0.15; // Max height proportional to distance
      const heightOffset = maxHeight * heightT * yardToPixelY;
      
      // Calculate velocity decay
      // Velocity decreases more rapidly at the end of the flight
      const velocityDecay = Math.pow(1 - t, 0.7);
      const currentVelocity = initialVelocity * velocityDecay;
      
      // Calculate lateral movement
      // More pronounced at lower velocities and affected by total distance
      const lateralFactor = Math.pow(1 - currentVelocity, 2);
      const distanceFactor = Math.pow(t, 3); // Increases with distance traveled
      const lateralT = lateralFactor * distanceFactor * windEffect;
      
      // Calculate positions
      const x = originX + (lateralOffset * lateralT * yardToPixelX);
      const y = originY - (distance * t * yardToPixelY) + heightOffset;

      ctx.lineTo(x, y);
      lastX = x;
      lastY = y;
    }
    
    ctx.stroke()

    // Draw landing zone
    ctx.beginPath()
    ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI)
    ctx.fillStyle = '#10B981'
    ctx.fill()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-3 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Distance</div>
          <div className="text-lg font-bold text-emerald-400">
            {Math.round(params.distance)}<span className="text-xs ml-1">yds</span>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Wind</div>
          <div className="text-lg font-bold text-emerald-400">
            {Math.round(params.windSpeed)}<span className="text-xs ml-1">mph</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Distance</div>
          <Slider
            value={[params.distance]}
            min={100}
            max={300}
            step={5}
            onValueChange={([value]) => setParams(p => ({ ...p, distance: value }))}
          />
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Wind Speed</div>
          <Slider
            value={[params.windSpeed]}
            min={0}
            max={30}
            step={1}
            onValueChange={([value]) => setParams(p => ({ ...p, windSpeed: value }))}
          />
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Wind Direction</div>
          <Slider
            value={[params.windDirection]}
            min={0}
            max={360}
            step={5}
            onValueChange={([value]) => setParams(p => ({ ...p, windDirection: value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-3 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Direction</div>
          <div className="text-lg font-bold text-emerald-400">
            {Math.round(params.windDirection)}<span className="text-xs ml-1">°</span>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Offset</div>
          <div className="text-lg font-bold text-emerald-400">
            {calculateLateralOffset(params.distance, params.windSpeed, params.windDirection) > 0 ? 'R' : 'L'} {Math.abs(Math.round(calculateLateralOffset(params.distance, params.windSpeed, params.windDirection)))}<span className="text-xs ml-1">yds</span>
          </div>
        </div>
      </div>

      <div className="aspect-[2/1] w-full bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={800}
          height={400}
        />
      </div>
    </div>
  )
}
