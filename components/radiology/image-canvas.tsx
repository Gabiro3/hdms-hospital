"use client"

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { toast } from "@/components/ui/use-toast"

interface ImageCanvasProps {
  imageUrl: string
  zoom: number
  brightness: number
  contrast: number
  invert: boolean
  rotation: number
  flipped: { horizontal: boolean; vertical: boolean }
  activeTool: string
  shouldReset: boolean
  layout: string
  annotations: any[]
  onAnnotationsChange: (annotations: any[]) => void
  selectedAnnotationIndex: number | null
  onAnnotationSelect: (index: number | null) => void
  activeViewboxIndex: number
  onViewboxSelect: (index: number) => void
  viewboxCount: number
}

const ImageCanvas = forwardRef<any, ImageCanvasProps>(
  (
    {
      imageUrl,
      zoom,
      brightness,
      contrast,
      invert,
      rotation,
      flipped,
      activeTool,
      shouldReset,
      layout,
      annotations,
      onAnnotationsChange,
      selectedAnnotationIndex,
      onAnnotationSelect,
      activeViewboxIndex,
      onViewboxSelect,
      viewboxCount,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [lastX, setLastX] = useState(0)
    const [lastY, setLastY] = useState(0)
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
    const [isLoading, setIsLoading] = useState(false)
    const [errorLoading, setErrorLoading] = useState(false)
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
    const [viewboxes, setViewboxes] = useState<
      Array<{
        panOffset: { x: number; y: number }
        zoom: number
        brightness: number
        contrast: number
        invert: boolean
        rotation: number
        flipped: { horizontal: boolean; vertical: boolean }
      }>
    >([])

    // Initialize viewboxes
    useEffect(() => {
      const initialViewboxes = Array(viewboxCount)
        .fill(null)
        .map(() => ({
          panOffset: { x: 0, y: 0 },
          zoom,
          brightness,
          contrast,
          invert,
          rotation,
          flipped: { ...flipped },
        }))
      setViewboxes(initialViewboxes)
    }, [viewboxCount])

    // Update active viewbox settings when global settings change
    useEffect(() => {
      if (viewboxes.length > 0 && activeViewboxIndex < viewboxes.length) {
        const updatedViewboxes = [...viewboxes]
        updatedViewboxes[activeViewboxIndex] = {
          ...updatedViewboxes[activeViewboxIndex],
          zoom,
          brightness,
          contrast,
          invert,
          rotation,
          flipped: { ...flipped },
        }
        setViewboxes(updatedViewboxes)
      }
    }, [zoom, brightness, contrast, invert, rotation, flipped, activeViewboxIndex])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      getCanvasCenter: () => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        return {
          x: canvas.width / 2,
          y: canvas.height / 2,
        }
      },
    }))

    // Load the image when component mounts or imageUrl changes
    useEffect(() => {
      if (!imageUrl) return

      setIsLoading(true)
      setErrorLoading(false)

      const img = new Image()
      img.crossOrigin = "anonymous" // Prevent CORS issues

      img.onload = () => {
        imageRef.current = img
        setIsLoading(false)
        drawImage()
      }

      img.onerror = (error) => {
        console.error("Error loading image:", error)
        setIsLoading(false)
        setErrorLoading(true)
        toast({
          title: "Error",
          description: "Failed to load the image. The format may be unsupported or the file may be corrupted.",
          variant: "destructive",
        })
      }

      img.src = imageUrl

      return () => {
        // Cleanup
        if (imageRef.current) {
          imageRef.current.onload = null
          imageRef.current.onerror = null
        }
      }
    }, [imageUrl])

    // Apply transformations when settings change
    useEffect(() => {
      if (imageRef.current) {
        drawImage()
      }
    }, [viewboxes, layout, annotations, selectedAnnotationIndex, activeViewboxIndex, viewboxCount])

    // Reset canvas when shouldReset is true
    useEffect(() => {
      if (shouldReset && imageRef.current) {
        setPanOffset({ x: 0, y: 0 })

        // Reset all viewboxes
        const resetViewboxes = viewboxes.map(() => ({
          panOffset: { x: 0, y: 0 },
          zoom,
          brightness,
          contrast,
          invert,
          rotation,
          flipped: { ...flipped },
        }))
        setViewboxes(resetViewboxes)

        drawImage()
      }
    }, [shouldReset])

    // Initialize canvas and event listeners
    useEffect(() => {
      const canvas = canvasRef.current
      const container = containerRef.current

      if (!canvas || !container) return

      // Resize observer to handle container size changes
      const resizeObserver = new ResizeObserver(() => {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        if (imageRef.current) {
          drawImage()
        }
      })

      resizeObserver.observe(container)

      // Mouse event handlers
      const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Determine which viewbox was clicked in multi-viewbox layouts
        const clickedViewboxIndex = getViewboxAtPoint(x, y)
        if (clickedViewboxIndex !== -1 && clickedViewboxIndex !== activeViewboxIndex) {
          onViewboxSelect(clickedViewboxIndex)
          return
        }

        // Check if an annotation was clicked when in select mode
        if (activeTool === "select") {
          const clickedAnnotationIndex = findAnnotationAtPoint(x, y)
          onAnnotationSelect(clickedAnnotationIndex)

          if (clickedAnnotationIndex !== null) {
            setIsDrawing(true)
            setLastX(x)
            setLastY(y)
          }
          return
        }

        // Handle different tools
        if (activeTool === "pan") {
          setIsDrawing(true)
          setLastX(x)
          setLastY(y)
        } else if (activeTool === "draw") {
          setIsDrawing(true)
          setLastX(x)
          setLastY(y)

          // Add a new annotation if drawing
          const newAnnotation = {
            type: "freehand",
            color: "#ff0000",
            points: [{ x, y }],
          }
          onAnnotationsChange([...annotations, newAnnotation])
        } else if (activeTool === "circle") {
          setIsDrawing(true)
          setStartPoint({ x, y })

          // Add a new circle annotation
          const newAnnotation = {
            type: "circle",
            color: "#00ff00",
            startX: x,
            startY: y,
            radius: 0,
          }
          onAnnotationsChange([...annotations, newAnnotation])
        } else if (activeTool === "rectangle") {
          setIsDrawing(true)
          setStartPoint({ x, y })

          // Add a new rectangle annotation
          const newAnnotation = {
            type: "rectangle",
            color: "#0000ff",
            startX: x,
            startY: y,
            width: 0,
            height: 0,
          }
          onAnnotationsChange([...annotations, newAnnotation])
        } else if (activeTool === "measure") {
          setIsDrawing(true)
          setStartPoint({ x, y })

          // Add a new measurement annotation
          const newAnnotation = {
            type: "measure",
            color: "#ffff00",
            startX: x,
            startY: y,
            endX: x,
            endY: y,
          }
          onAnnotationsChange([...annotations, newAnnotation])
        } else if (activeTool === "arrow") {
          setIsDrawing(true)
          setStartPoint({ x, y })

          // Add a new arrow annotation
          const newAnnotation = {
            type: "arrow",
            color: "#ff6600",
            startX: x,
            startY: y,
            endX: x,
            endY: y,
          }
          onAnnotationsChange([...annotations, newAnnotation])
        } else if (activeTool === "highlight") {
          setIsDrawing(true)
          setStartPoint({ x, y })

          // Add a new highlight annotation
          const newAnnotation = {
            type: "highlight",
            color: "rgba(255, 255, 0, 0.3)",
            startX: x,
            startY: y,
            width: 0,
            height: 0,
          }
          onAnnotationsChange([...annotations, newAnnotation])
        } else if (activeTool === "erase") {
          // Find annotation at point and remove it
          const annotationIndex = findAnnotationAtPoint(x, y)
          if (annotationIndex !== null) {
            const newAnnotations = [...annotations.slice(0, annotationIndex), ...annotations.slice(annotationIndex + 1)]
            onAnnotationsChange(newAnnotations)
            onAnnotationSelect(null)
          }
        }
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawing) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (activeTool === "select" && selectedAnnotationIndex !== null) {
          // Move the selected annotation
          const dx = x - lastX
          const dy = y - lastY
          const updatedAnnotations = [...annotations]
          const annotation = updatedAnnotations[selectedAnnotationIndex]

          if (annotation.type === "freehand") {
            // Move all points
            annotation.points = annotation.points.map((point: any) => ({
              x: point.x + dx,
              y: point.y + dy,
            }))
          } else if (annotation.type === "text") {
            // Move text position
            annotation.x += dx
            annotation.y += dy
          } else if (annotation.type === "circle") {
            // Move circle center
            annotation.startX += dx
            annotation.startY += dy
          } else if (annotation.type === "rectangle" || annotation.type === "highlight") {
            // Move rectangle position
            annotation.startX += dx
            annotation.startY += dy
          } else if (annotation.type === "measure" || annotation.type === "arrow") {
            // Move both endpoints
            annotation.startX += dx
            annotation.startY += dy
            annotation.endX += dx
            annotation.endY += dy
          }

          onAnnotationsChange(updatedAnnotations)
          setLastX(x)
          setLastY(y)
          drawImage()
        } else if (activeTool === "pan") {
          const dx = x - lastX
          const dy = y - lastY

          // Update the active viewbox's pan offset
          const updatedViewboxes = [...viewboxes]
          updatedViewboxes[activeViewboxIndex].panOffset.x += dx
          updatedViewboxes[activeViewboxIndex].panOffset.y += dy
          setViewboxes(updatedViewboxes)

          setLastX(x)
          setLastY(y)
          drawImage()
        } else if (activeTool === "draw") {
          const updatedAnnotations = [...annotations]
          const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

          if (currentAnnotation && currentAnnotation.type === "freehand") {
            currentAnnotation.points.push({ x, y })
            onAnnotationsChange(updatedAnnotations)
            drawImage()
          }
        } else if (activeTool === "circle" && startPoint) {
          const updatedAnnotations = [...annotations]
          const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

          if (currentAnnotation && currentAnnotation.type === "circle") {
            const dx = x - currentAnnotation.startX
            const dy = y - currentAnnotation.startY
            currentAnnotation.radius = Math.sqrt(dx * dx + dy * dy)
            onAnnotationsChange(updatedAnnotations)
            drawImage()
          }
        } else if (activeTool === "rectangle" && startPoint) {
          const updatedAnnotations = [...annotations]
          const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

          if (currentAnnotation && currentAnnotation.type === "rectangle") {
            currentAnnotation.width = x - currentAnnotation.startX
            currentAnnotation.height = y - currentAnnotation.startY
            onAnnotationsChange(updatedAnnotations)
            drawImage()
          }
        } else if (activeTool === "measure" && startPoint) {
          const updatedAnnotations = [...annotations]
          const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

          if (currentAnnotation && currentAnnotation.type === "measure") {
            currentAnnotation.endX = x
            currentAnnotation.endY = y
            onAnnotationsChange(updatedAnnotations)
            drawImage()
          }
        } else if (activeTool === "arrow" && startPoint) {
          const updatedAnnotations = [...annotations]
          const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

          if (currentAnnotation && currentAnnotation.type === "arrow") {
            currentAnnotation.endX = x
            currentAnnotation.endY = y
            onAnnotationsChange(updatedAnnotations)
            drawImage()
          }
        } else if (activeTool === "highlight" && startPoint) {
          const updatedAnnotations = [...annotations]
          const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

          if (currentAnnotation && currentAnnotation.type === "highlight") {
            currentAnnotation.width = x - currentAnnotation.startX
            currentAnnotation.height = y - currentAnnotation.startY
            onAnnotationsChange(updatedAnnotations)
            drawImage()
          }
        }
      }

      const handleMouseUp = () => {
        setIsDrawing(false)
        setStartPoint(null)
      }

      const handleMouseLeave = () => {
        setIsDrawing(false)
        setStartPoint(null)
      }

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()

        // Zoom functionality for the active viewbox
        const updatedViewboxes = [...viewboxes]
        let newZoom = updatedViewboxes[activeViewboxIndex].zoom

        if (e.deltaY < 0) {
          newZoom = Math.min(newZoom + 10, 500)
        } else {
          newZoom = Math.max(newZoom - 10, 10)
        }

        updatedViewboxes[activeViewboxIndex].zoom = newZoom
        setViewboxes(updatedViewboxes)
        drawImage()
      }

      // Add event listeners
      canvas.addEventListener("mousedown", handleMouseDown)
      canvas.addEventListener("mousemove", handleMouseMove)
      canvas.addEventListener("mouseup", handleMouseUp)
      canvas.addEventListener("mouseleave", handleMouseLeave)
      canvas.addEventListener("wheel", handleWheel, { passive: false })

      return () => {
        // Cleanup
        resizeObserver.disconnect()
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseup", handleMouseUp)
        canvas.removeEventListener("mouseleave", handleMouseLeave)
        canvas.removeEventListener("wheel", handleWheel)
      }
    }, [
      activeTool,
      isDrawing,
      lastX,
      lastY,
      startPoint,
      annotations,
      selectedAnnotationIndex,
      activeViewboxIndex,
      viewboxes,
    ])

    // Find which viewbox contains the given point
    const getViewboxAtPoint = (x: number, y: number) => {
      const canvas = canvasRef.current
      if (!canvas) return -1

      const positions = getViewboxPositions()
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i]
        if (x >= pos.x && x <= pos.x + pos.width && y >= pos.y && y <= pos.y + pos.height) {
          return i
        }
      }
      return -1
    }

    // Find annotation at a specific point
    const findAnnotationAtPoint = (x: number, y: number) => {
      // Check in reverse order (top-most annotation first)
      for (let i = annotations.length - 1; i >= 0; i--) {
        const annotation = annotations[i]

        if (annotation.type === "freehand") {
          // For freehand, check if point is near any segment
          for (let j = 1; j < annotation.points.length; j++) {
            const p1 = annotation.points[j - 1]
            const p2 = annotation.points[j]
            if (isPointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, 5)) {
              return i
            }
          }
        } else if (annotation.type === "circle") {
          // For circle, check if point is near the circumference
          const dx = x - annotation.startX
          const dy = y - annotation.startY
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (Math.abs(distance - annotation.radius) < 5) {
            return i
          }
        } else if (annotation.type === "rectangle" || annotation.type === "highlight") {
          // For rectangle, check if point is near any edge
          const left = annotation.startX
          const top = annotation.startY
          const right = annotation.startX + annotation.width
          const bottom = annotation.startY + annotation.height

          if (
            (Math.abs(x - left) < 5 && y >= top && y <= bottom) ||
            (Math.abs(x - right) < 5 && y >= top && y <= bottom) ||
            (Math.abs(y - top) < 5 && x >= left && x <= right) ||
            (Math.abs(y - bottom) < 5 && x >= left && x <= right)
          ) {
            return i
          }
        } else if (annotation.type === "measure" || annotation.type === "arrow") {
          // For measure/arrow, check if point is near the line
          if (isPointNearLine(x, y, annotation.startX, annotation.startY, annotation.endX, annotation.endY, 5)) {
            return i
          }
        } else if (annotation.type === "text") {
          // For text, check if point is within the text box
          const textWidth = annotation.text.length * annotation.fontSize * 0.6
          const textHeight = annotation.fontSize * 1.2

          if (
            x >= annotation.x &&
            x <= annotation.x + textWidth &&
            y >= annotation.y - textHeight &&
            y <= annotation.y
          ) {
            return i
          }
        }
      }

      return null
    }

    // Check if a point is near a line segment
    const isPointNearLine = (
      px: number,
      py: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      threshold: number,
    ) => {
      const A = px - x1
      const B = py - y1
      const C = x2 - x1
      const D = y2 - y1

      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1

      if (lenSq !== 0) param = dot / lenSq

      let xx, yy

      if (param < 0) {
        xx = x1
        yy = y1
      } else if (param > 1) {
        xx = x2
        yy = y2
      } else {
        xx = x1 + param * C
        yy = y1 + param * D
      }

      const dx = px - xx
      const dy = py - yy
      const distance = Math.sqrt(dx * dx + dy * dy)

      return distance < threshold
    }

    // Get positions for each viewbox based on layout
    const getViewboxPositions = () => {
      const canvas = canvasRef.current
      if (!canvas) return []

      const positions: Array<{ x: number; y: number; width: number; height: number }> = []

      if (layout === "1x1") {
        positions.push({
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        })
      } else if (layout === "1x2") {
        const halfWidth = canvas.width / 2
        positions.push(
          {
            x: 0,
            y: 0,
            width: halfWidth,
            height: canvas.height,
          },
          {
            x: halfWidth,
            y: 0,
            width: halfWidth,
            height: canvas.height,
          },
        )
      } else if (layout === "2x2") {
        const halfWidth = canvas.width / 2
        const halfHeight = canvas.height / 2
        positions.push(
          {
            x: 0,
            y: 0,
            width: halfWidth,
            height: halfHeight,
          },
          {
            x: halfWidth,
            y: 0,
            width: halfWidth,
            height: halfHeight,
          },
          {
            x: 0,
            y: halfHeight,
            width: halfWidth,
            height: halfHeight,
          },
          {
            x: halfWidth,
            y: halfHeight,
            width: halfWidth,
            height: halfHeight,
          },
        )
      }

      return positions
    }

    // Function to draw the image with current transformations
    const drawImage = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      const img = imageRef.current

      if (!canvas || !ctx || !img) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get viewbox positions
      const positions = getViewboxPositions()

      // Draw each viewbox
      for (let i = 0; i < Math.min(positions.length, viewboxes.length); i++) {
        const pos = positions[i]
        const viewbox = viewboxes[i]

        // Draw border around active viewbox
        if (i === activeViewboxIndex) {
          ctx.strokeStyle = "#3b82f6" // primary color
          ctx.lineWidth = 2
          ctx.strokeRect(pos.x, pos.y, pos.width, pos.height)
        }

        // Save the current context state
        ctx.save()

        // Create clipping region for this viewbox
        ctx.beginPath()
        ctx.rect(pos.x, pos.y, pos.width, pos.height)
        ctx.clip()

        // Apply viewbox-specific transformations
        if (viewbox.invert) {
          ctx.filter = "invert(100%)"
        }

        // Apply brightness and contrast
        const brightnessValue = (viewbox.brightness - 100) / 100
        const contrastValue = viewbox.contrast / 100
        ctx.filter = `${ctx.filter} brightness(${1 + brightnessValue}) contrast(${contrastValue})`

        // Calculate scaling based on zoom level
        const scale = viewbox.zoom / 100

        // Calculate position to center the image
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale

        // Calculate center position for this viewbox
        const centerX = pos.x + pos.width / 2
        const centerY = pos.y + pos.height / 2

        // Apply transformations
        ctx.translate(centerX, centerY)
        ctx.rotate((viewbox.rotation * Math.PI) / 180)
        ctx.scale(viewbox.flipped.horizontal ? -1 : 1, viewbox.flipped.vertical ? -1 : 1)

        // Draw the image
        ctx.drawImage(
          img,
          -scaledWidth / 2 + viewbox.panOffset.x,
          -scaledHeight / 2 + viewbox.panOffset.y,
          scaledWidth,
          scaledHeight,
        )

        // Restore context for annotations
        ctx.restore()

        // Only draw annotations in the active viewbox
        if (i === activeViewboxIndex) {
          // Draw annotations
          annotations.forEach((annotation, index) => {
            const isSelected = index === selectedAnnotationIndex

            if (annotation.type === "freehand" && annotation.points.length > 1) {
              ctx.beginPath()
              ctx.strokeStyle = annotation.color
              ctx.lineWidth = isSelected ? 3 : 2
              ctx.moveTo(annotation.points[0].x, annotation.points[0].y)

              for (let i = 1; i < annotation.points.length; i++) {
                ctx.lineTo(annotation.points[i].x, annotation.points[i].y)
              }

              ctx.stroke()

              // Draw selection handles if selected
              if (isSelected) {
                annotation.points.forEach((point: any) => {
                  ctx.fillStyle = "#ffffff"
                  ctx.strokeStyle = "#3b82f6"
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
                  ctx.fill()
                  ctx.stroke()
                })
              }
            } else if (annotation.type === "circle") {
              ctx.beginPath()
              ctx.strokeStyle = annotation.color
              ctx.lineWidth = isSelected ? 3 : 2
              ctx.arc(annotation.startX, annotation.startY, annotation.radius, 0, 2 * Math.PI)
              ctx.stroke()

              // Draw ROI stats if needed
              ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
              ctx.fillRect(annotation.startX + annotation.radius + 5, annotation.startY - 20, 100, 40)
              ctx.fillStyle = annotation.color
              ctx.font = "12px Arial"
              ctx.fillText(`ROI: Circle`, annotation.startX + annotation.radius + 10, annotation.startY - 5)
              ctx.fillText(
                `Radius: ${Math.round(annotation.radius)}px`,
                annotation.startX + annotation.radius + 10,
                annotation.startY + 10,
              )

              // Draw selection handles if selected
              if (isSelected) {
                // Center handle
                ctx.fillStyle = "#ffffff"
                ctx.strokeStyle = "#3b82f6"
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.arc(annotation.startX, annotation.startY, 4, 0, 2 * Math.PI)
                ctx.fill()
                ctx.stroke()

                // Radius handle
                const angleRad = Math.PI / 4 // 45 degrees
                const handleX = annotation.startX + Math.cos(angleRad) * annotation.radius
                const handleY = annotation.startY + Math.sin(angleRad) * annotation.radius
                ctx.beginPath()
                ctx.arc(handleX, handleY, 4, 0, 2 * Math.PI)
                ctx.fill()
                ctx.stroke()
              }
            } else if (annotation.type === "rectangle") {
              ctx.beginPath()
              ctx.strokeStyle = annotation.color
              ctx.lineWidth = isSelected ? 3 : 2
              ctx.rect(annotation.startX, annotation.startY, annotation.width, annotation.height)
              ctx.stroke()

              // Add ROI stats
              ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
              ctx.fillRect(annotation.startX + annotation.width + 5, annotation.startY, 120, 40)
              ctx.fillStyle = annotation.color
              ctx.font = "12px Arial"
              ctx.fillText(`ROI: Rectangle`, annotation.startX + annotation.width + 10, annotation.startY + 15)
              ctx.fillText(
                `${Math.abs(Math.round(annotation.width))}x${Math.abs(Math.round(annotation.height))}px`,
                annotation.startX + annotation.width + 10,
                annotation.startY + 30,
              )

              // Draw selection handles if selected
              if (isSelected) {
                // Corner handles
                const corners = [
                  { x: annotation.startX, y: annotation.startY },
                  { x: annotation.startX + annotation.width, y: annotation.startY },
                  { x: annotation.startX, y: annotation.startY + annotation.height },
                  { x: annotation.startX + annotation.width, y: annotation.startY + annotation.height },
                ]

                corners.forEach((corner) => {
                  ctx.fillStyle = "#ffffff"
                  ctx.strokeStyle = "#3b82f6"
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.arc(corner.x, corner.y, 4, 0, 2 * Math.PI)
                  ctx.fill()
                  ctx.stroke()
                })
              }
            } else if (annotation.type === "measure") {
              // Draw line
              ctx.beginPath()
              ctx.strokeStyle = annotation.color
              ctx.lineWidth = isSelected ? 3 : 2
              ctx.moveTo(annotation.startX, annotation.startY)
              ctx.lineTo(annotation.endX, annotation.endY)
              ctx.stroke()

              // Calculate distance
              const dx = annotation.endX - annotation.startX
              const dy = annotation.endY - annotation.startY
              const distance = Math.sqrt(dx * dx + dy * dy)

              // Draw distance text
              ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
              ctx.fillRect(
                (annotation.startX + annotation.endX) / 2 - 40,
                (annotation.startY + annotation.endY) / 2 - 10,
                80,
                20,
              )
              ctx.fillStyle = annotation.color
              ctx.font = "12px Arial"
              ctx.fillText(
                `${Math.round(distance)}px`,
                (annotation.startX + annotation.endX) / 2 - 20,
                (annotation.startY + annotation.endY) / 2 + 5,
              )

              // Draw selection handles if selected
              if (isSelected) {
                // Endpoint handles
                const points = [
                  { x: annotation.startX, y: annotation.startY },
                  { x: annotation.endX, y: annotation.endY },
                ]

                points.forEach((point) => {
                  ctx.fillStyle = "#ffffff"
                  ctx.strokeStyle = "#3b82f6"
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
                  ctx.fill()
                  ctx.stroke()
                })
              }
            } else if (annotation.type === "arrow") {
              // Draw line
              ctx.beginPath()
              ctx.strokeStyle = annotation.color
              ctx.lineWidth = isSelected ? 3 : 2
              ctx.moveTo(annotation.startX, annotation.startY)
              ctx.lineTo(annotation.endX, annotation.endY)
              ctx.stroke()

              // Draw arrowhead
              const angle = Math.atan2(annotation.endY - annotation.startY, annotation.endX - annotation.startX)
              const arrowLength = 15

              ctx.beginPath()
              ctx.moveTo(annotation.endX, annotation.endY)
              ctx.lineTo(
                annotation.endX - arrowLength * Math.cos(angle - Math.PI / 6),
                annotation.endY - arrowLength * Math.sin(angle - Math.PI / 6),
              )
              ctx.lineTo(
                annotation.endX - arrowLength * Math.cos(angle + Math.PI / 6),
                annotation.endY - arrowLength * Math.sin(angle + Math.PI / 6),
              )
              ctx.closePath()
              ctx.fillStyle = annotation.color
              ctx.fill()

              // Draw selection handles if selected
              if (isSelected) {
                // Endpoint handles
                const points = [
                  { x: annotation.startX, y: annotation.startY },
                  { x: annotation.endX, y: annotation.endY },
                ]

                points.forEach((point) => {
                  ctx.fillStyle = "#ffffff"
                  ctx.strokeStyle = "#3b82f6"
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI)
                  ctx.fill()
                  ctx.stroke()
                })
              }
            } else if (annotation.type === "highlight") {
              // Draw semi-transparent highlight
              ctx.fillStyle = annotation.color
              ctx.fillRect(annotation.startX, annotation.startY, annotation.width, annotation.height)

              // Draw border
              if (isSelected) {
                ctx.strokeStyle = "#3b82f6"
                ctx.lineWidth = 2
                ctx.strokeRect(annotation.startX, annotation.startY, annotation.width, annotation.height)

                // Draw corner handles
                const corners = [
                  { x: annotation.startX, y: annotation.startY },
                  { x: annotation.startX + annotation.width, y: annotation.startY },
                  { x: annotation.startX, y: annotation.startY + annotation.height },
                  { x: annotation.startX + annotation.width, y: annotation.startY + annotation.height },
                ]

                corners.forEach((corner) => {
                  ctx.fillStyle = "#ffffff"
                  ctx.strokeStyle = "#3b82f6"
                  ctx.lineWidth = 1
                  ctx.beginPath()
                  ctx.arc(corner.x, corner.y, 4, 0, 2 * Math.PI)
                  ctx.fill()
                  ctx.stroke()
                })
              }
            } else if (annotation.type === "text") {
              // Draw text with background
              const fontSize = annotation.fontSize || 16
              ctx.font = `${fontSize}px Arial`

              // Draw background
              const textWidth = ctx.measureText(annotation.text).width
              const textHeight = fontSize * 1.2
              ctx.fillStyle = annotation.backgroundColor || "rgba(255, 255, 255, 0.7)"
              ctx.fillRect(annotation.x - 2, annotation.y - textHeight, textWidth + 4, textHeight + 4)

              // Draw text
              ctx.fillStyle = annotation.color
              ctx.fillText(annotation.text, annotation.x, annotation.y)

              // Draw selection border if selected
              if (isSelected) {
                ctx.strokeStyle = "#3b82f6"
                ctx.lineWidth = 1
                ctx.strokeRect(annotation.x - 2, annotation.y - textHeight, textWidth + 4, textHeight + 4)

                // Draw handle
                ctx.fillStyle = "#ffffff"
                ctx.strokeStyle = "#3b82f6"
                ctx.beginPath()
                ctx.arc(annotation.x + textWidth / 2, annotation.y - textHeight / 2, 4, 0, 2 * Math.PI)
                ctx.fill()
                ctx.stroke()
              }
            }
          })
        }
      }
    }

    return (
      <div ref={containerRef} className="w-full h-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white">Loading image...</div>
          </div>
        )}

        {errorLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white text-center p-4">
              <p className="text-red-400 font-semibold mb-2">Error loading image</p>
              <p className="text-sm">The image format may be unsupported or the file may be corrupted.</p>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            cursor:
              activeTool === "pan"
                ? "grab"
                : activeTool === "draw" || activeTool === "arrow" || activeTool === "highlight"
                  ? "crosshair"
                  : activeTool === "select"
                    ? "pointer"
                    : activeTool === "erase"
                      ? "not-allowed"
                      : "default",
          }}
        />
      </div>
    )
  },
)

ImageCanvas.displayName = "ImageCanvas"

export default ImageCanvas
