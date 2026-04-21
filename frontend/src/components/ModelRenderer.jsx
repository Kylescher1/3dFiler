import { useRef, useMemo, Suspense, useLayoutEffect, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { useGLTF, Box } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'

function GltfModel({ url, onReady }) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  return <AutoFitModel scene={clonedScene} onReady={onReady} />
}

function ObjModel({ url, onReady }) {
  const obj = useLoader(OBJLoader, url)
  const clonedObj = useMemo(() => obj.clone(), [obj])
  return <AutoFitModel scene={clonedObj} onReady={onReady} />
}

function FbxModel({ url, onReady }) {
  const fbx = useLoader(FBXLoader, url)
  const clonedFbx = useMemo(() => fbx.clone(), [fbx])
  return <AutoFitModel scene={clonedFbx} onReady={onReady} />
}

function StlModel({ url, onReady }) {
  const geometry = useLoader(STLLoader, url)
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a0a0a0', roughness: 0.3, metalness: 0.1 }), [])
  const meshRef = useRef()
  const [ready, setReady] = useState(false)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useLayoutEffect(() => {
    if (!meshRef.current) return
    // Reset to ensure clean measurement
    meshRef.current.position.set(0, 0, 0)
    meshRef.current.scale.set(1, 1, 1)
    meshRef.current.rotation.set(0, 0, 0)

    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const targetSize = 4
    const scale = maxDim > 0 ? targetSize / maxDim : 1

    meshRef.current.position.set(-center.x * scale, -center.y * scale + (size.y * scale) / 2, -center.z * scale)
    meshRef.current.scale.setScalar(scale)
    meshRef.current.rotation.x = -Math.PI / 2

    setReady(true)
    onReadyRef.current?.(meshRef.current)
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} visible={ready} />
  )
}

function AutoFitModel({ scene, onReady }) {
  const groupRef = useRef()
  const [ready, setReady] = useState(false)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useLayoutEffect(() => {
    if (!groupRef.current) return
    // Reset to ensure clean measurement (handles re-runs / Strict Mode)
    groupRef.current.position.set(0, 0, 0)
    groupRef.current.scale.set(1, 1, 1)
    groupRef.current.rotation.set(0, 0, 0)

    const box = new THREE.Box3().setFromObject(groupRef.current)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    const targetSize = 4
    const scale = maxDim > 0 ? targetSize / maxDim : 1

    groupRef.current.position.set(
      -center.x * scale,
      -center.y * scale + (size.y * scale) / 2,
      -center.z * scale
    )
    groupRef.current.scale.setScalar(scale)

    setReady(true)
    onReadyRef.current?.(groupRef.current)
  }, [scene])

  return (
    <group ref={groupRef} visible={ready}>
      {scene && <primitive object={scene} />}
    </group>
  )
}

export function ModelRenderer({ url, extension, onReady }) {
  const ext = extension?.toLowerCase()

  return (
    <Suspense fallback={
      <group>
        <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#444" wireframe />
        </Box>
      </group>
    }>
      {ext === 'glb' || ext === 'gltf' ? (
        <GltfModel url={url} onReady={onReady} />
      ) : ext === 'obj' ? (
        <ObjModel url={url} onReady={onReady} />
      ) : ext === 'fbx' ? (
        <FbxModel url={url} onReady={onReady} />
      ) : ext === 'stl' ? (
        <StlModel url={url} onReady={onReady} />
      ) : (
        <group>
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#333" wireframe />
          </Box>
        </group>
      )}
    </Suspense>
  )
}

export const SUPPORTED_FORMATS = ['gltf', 'glb', 'obj', 'fbx', 'stl']
