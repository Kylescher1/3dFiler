import { useRef, useMemo, Suspense } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import { useGLTF, Box } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'

function GltfModel({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene.clone()} />
}

function ObjModel({ url }) {
  const obj = useLoader(OBJLoader, url)
  return <primitive object={obj.clone()} />
}

function FbxModel({ url }) {
  const fbx = useLoader(FBXLoader, url)
  return <primitive object={fbx.clone()} />
}

function StlModel({ url }) {
  const geometry = useLoader(STLLoader, url)
  const meshRef = useRef()
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.4, metalness: 0.2 }), [])
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
  )
}

function AutoRotate({ children, enabled }) {
  const groupRef = useRef()
  useFrame((_, delta) => {
    if (enabled && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })
  return <group ref={groupRef}>{children}</group>
}

export function ModelRenderer({ url, extension }) {
  const ext = extension?.toLowerCase()

  return (
    <AutoRotate enabled={false}>
      <Suspense fallback={
        <group>
          <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#444" wireframe />
          </Box>
        </group>
      }>
        {ext === 'glb' || ext === 'gltf' ? (
          <GltfModel url={url} />
        ) : ext === 'obj' ? (
          <ObjModel url={url} />
        ) : ext === 'fbx' ? (
          <FbxModel url={url} />
        ) : ext === 'stl' ? (
          <StlModel url={url} />
        ) : (
          <group>
            <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
              <meshStandardMaterial color="#333" wireframe />
            </Box>
          </group>
        )}
      </Suspense>
    </AutoRotate>
  )
}

export const SUPPORTED_FORMATS = ['gltf', 'glb', 'obj', 'fbx', 'stl']
