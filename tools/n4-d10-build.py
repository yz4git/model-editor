"""D10: topology-preserving VRoid head study. No private reference in CI."""
import bpy, os, sys, json, math, shutil, traceback
from pathlib import Path
from mathutils import Vector
OUT=Path(os.environ["BLENDER_ASSETS_DIR"])
TMP=Path(os.environ["RUNNER_TEMP"])
VAR=os.environ["N4_VARIANT"]
OUT.mkdir(parents=True,exist_ok=True)
def objects(): return [o for o in bpy.context.scene.objects if o.type=='MESH']
def label(o): return (o.name+" "+o.data.name+" "+" ".join(m.name for m in o.data.materials if m)).lower()
def is_hair(o): return any(s in label(o) for s in ('hair','kami','髪'))
def bounds(obs):
    vs=[o.matrix_world@v.co for o in obs for v in o.data.vertices]
    if not vs: raise RuntimeError("empty bounds")
    return Vector(tuple(min(v[i] for v in vs) for i in range(3))),Vector(tuple(max(v[i] for v in vs) for i in range(3)))
def import_vrm(path):
    before=set(bpy.data.objects)
    # VRM0 is a binary glTF; retain geometry, skin and morphs via standard importer.
    glb=TMP/(path.stem+".glb")
    shutil.copyfile(path,glb)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    return [o for o in bpy.data.objects if o not in before and o.type=="MESH"]
def face_objects(obs):
    face=[o for o in obs if not is_hair(o) and any(s in label(o) for s in ('face','head','顔'))]
    if not face: raise RuntimeError("could not identify face: "+str([label(o) for o in obs]))
    return face
def keep_head(obs,face,hair):
    for o in obs:
        if o not in face and o not in hair and not any(s in label(o) for s in ('eye','brow','mouth','lash','瞳','眉')):
            bpy.data.objects.remove(o,do_unlink=True)
def edit_world(o,fn):
    mw=o.matrix_world.copy(); inv=mw.inverted()
    # Preserve vertex correspondence and all morph coordinates.
    if o.data.shape_keys:
        for key in o.data.shape_keys.key_blocks:
            for v in key.data: v.co=inv@fn(mw@v.co)
    else:
        for v in o.data.vertices:v.co=inv@fn(mw@v.co)
    o.data.update()
def recolor_hair(obs):
    for m in {m for o in obs for m in o.data.materials if m}:
        if not m.use_nodes: continue
        for p in m.node_tree.nodes:
            if p.type=='BSDF_PRINCIPLED':
                sock=p.inputs['Base Color']
                if sock.is_linked:
                    old=sock.links[0].from_socket
                    mul=m.node_tree.nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1
                    mul.inputs[2].default_value=(.25,.15,.12,1)
                    m.node_tree.links.new(old,mul.inputs[1]);m.node_tree.links.new(mul.outputs[0],sock)
                else:sock.default_value=(.055,.026,.018,1)
                p.inputs['Roughness'].default_value=.58
def import_legacy():
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(TMP/'legacy.glb'))
    return [o for o in bpy.data.objects if o not in before]
def construct():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    donor=next((TMP/'vroid').rglob('*.vrm'))
    obs=import_vrm(donor)
    faces=face_objects(obs); hairs=[o for o in obs if is_hair(o)]
    if not hairs: raise RuntimeError("VRoid donor hair not found: "+str([label(o) for o in obs]))
    lo,hi=bounds(faces); w=hi.x-lo.x; h=hi.z-lo.z
    center=(lo+hi)/2
    if w<=0 or h<=0: raise RuntimeError("invalid head bounds")
    keep_head(obs,faces,hairs)
    # Same face for all branches; topology, UVs, eye attachments and morphs retained.
    def face_fit(p):
        q=p.copy();z=(p.z-lo.z)/h
        jaw=max(0,1-z/.48)
        q.x=center.x+(p.x-center.x)*(1-.045*jaw)
        return q
    for o in objects():
        if o not in hairs: edit_world(o,face_fit)
    if VAR=='B':
        legacy=import_legacy()
        meshes=[o for o in legacy if o.type=='MESH']
        oldface=face_objects(meshes);oldhair=[o for o in meshes if is_hair(o)]
        if not oldhair: raise RuntimeError("legacy hair missing")
        a,b=bounds(oldface);c=(a+b)/2;factor=w/(b.x-a.x)
        for o in oldhair:
            coords=[o.matrix_world@v.co for v in o.data.vertices]
            for modifier in list(o.modifiers):o.modifiers.remove(modifier)
            o.parent=None;o.matrix_world.identity()
            if o.data.shape_keys:
                bpy.context.view_layer.objects.active=o;o.shape_key_clear()
            for v,p in zip(o.data.vertices,coords):v.co=center+(p-c)*factor
            o.name='D10_legacy_'+o.name
        for o in list(legacy):
            if o not in oldhair:bpy.data.objects.remove(o,do_unlink=True)
        for o in hairs:bpy.data.objects.remove(o,do_unlink=True)
        hairs=oldhair
    elif VAR=='C':
        # Rebuild silhouette from editable donor clump topology, not cylindrical strands.
        # Move the existing mesh control points, preserving UV seams and strand overlaps.
        for o in hairs:
            def sculpt(p):
                q=p.copy();d=max(0,(lo.z+.32*h-p.z)/h)
                q.z-=.58*h*d
                q.x=center.x+(p.x-center.x)*(1+.14*d)+w*.04*math.sin(4*d)*min(1,d)
                q.y=p.y+w*.05*math.sin(3*d)*min(1,d)
                return q
            edit_world(o,sculpt)
            o.name='D10_recut_'+o.name
    recolor_hair(hairs)
    bpy.context.view_layer.update()
    # Frame head and hair together; camera comparison uses same face-relative scale.
    report={'variant':VAR,'donor':str(donor.name),'face_width':w,'face_height':h,'head_center':list(center),'face_landmark_error':'unmeasured','hair_IoU':'unmeasured','source_reference':'not available in public CI','body_clothing_integration':'not done','B_source':'current legacy dist implementation, not verified R5/B34','C_source':'donor clump topology reshape, not newly drawn mesh','objects':[{'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons),'morphs':len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0,'materials':[m.name for m in o.data.materials if m]} for o in objects()]}
    (OUT/'metrics.json').write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'D10.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT/'D10.glb'),export_format='GLB')
    (OUT/'build.done').touch()
def render():
    info=json.loads((OUT/'metrics.json').read_text())
    c=Vector(info['head_center']);w=info['face_width'];h=info['face_height']
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.render.resolution_x=960;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('D10 World');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.22,.22,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
    scene.view_settings.view_transform='Standard'
    def aim(o,p):o.rotation_euler=(p-o.location).to_track_quat('-Z','Y').to_euler()
    for pos,energy,size in [((-3,-4,5),65,4),((3,-2,2),35,3),((0,4,4),70,3)]:
        data=bpy.data.lights.new('D10 area','AREA');data.energy=energy*w*w;data.shape='DISK';data.size=size*w
        o=bpy.data.objects.new('D10 light',data);scene.collection.objects.link(o);o.location=c+Vector(pos)*w;aim(o,c)
    cam=bpy.data.objects.new('D10 camera',bpy.data.cameras.new('D10 camera'));scene.collection.objects.link(cam);scene.camera=cam;cam.data.type='ORTHO'
    target=c-Vector((0,0,.22*h));cam.data.ortho_scale=max(2.7*h,2.8*w)
    clay=bpy.data.materials.new('Clay');clay.diffuse_color=(.62,.62,.62,1);clay.use_nodes=True
    clay.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.62,.62,.62,1)
    for mode in ('color','clay'):
        scene.view_layers[0].material_override=clay if mode=='clay' else None
        for angle in (0,45,90,180):
            a=math.radians(angle);cam.location=target+Vector((math.sin(a),-math.cos(a),0))*w*8;aim(cam,target)
            scene.render.filepath=str(OUT/f'D10_{mode}_{angle:03}.png')
            bpy.ops.render.render(write_still=True)
def poll():
    if not (OUT/'build.request').exists():return 1.0
    try:construct()
    except Exception:(OUT/'build.error').write_text(traceback.format_exc());raise
    return None
if os.getenv('N4_RENDER')=='1':render()
else:bpy.app.timers.register(poll,first_interval=1.0)
