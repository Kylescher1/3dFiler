import { useRef, useMemo, Suspense, useEffect } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { useGLTF, Box } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'

function GltfModel({ url, onReady }) {
  const { scene } = useGLTF(url)
  return <AutoFitModel scene={scene.clone()} onReady={onReady} />
}

function ObjModel({ url, onReady }) {
  const obj = useLoader(OBJLoader, url)
  return <AutoFitModel scene={obj.clone()} onReady={onReady} />
}

function FbxModel({ url, onReady }) {
  const fbx = useLoader(FBXLoader, url)
  return <AutoFitModel scene={fbx.clone()} onReady={onReady} />
}

function StlModel({ url, onReady }) {
  const geometry = useLoader(STLLoader, url)
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a0a0a0', roughness: 0.3, metalness: 0.1 }), [])
  const meshRef = useRef()

  useEffect(() => {
    if (meshRef.current) {
      onReady?.(meshRef.current)
    }
  }, [onReady])

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
  )
}

function AutoFitModel({ scene, onReady }) {
  const groupRef = useRef()

  useEffect(() => {
    if (!groupRef.current) return

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(groupRef.current)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // Auto-scale to fit in a ~4-unit box
    const targetSize = 4
    const scale = maxDim > 0 ? targetSize / maxDim : 1

    // Center the model
    groupRef.current.position.set(
      -center.x * scale,
      -center.y * scale + (size.y * scale) / 2,
      -center.z * scale
    )
    groupRef.current.scale.setScalar(scale)

    onReady?.(groupRef.current)
  }, [onReady])

  return <group ref={groupRef}>{scene && <primitive object={scene} />}</group>
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
