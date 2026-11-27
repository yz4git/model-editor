"""D11: full-body VRoid donor with reference-authored hair. No reference image in CI."""
import bpy, os, json, math, shutil, traceback
from pathlib import Path
from mathutils import Vector
OUT=Path(os.environ["BLENDER_ASSETS_DIR"]); TMP=Path(os.environ["RUNNER_TEMP"])
OUT.mkdir(parents=True,exist_ok=True)
def mesh_objects(): return [o for o in bpy.context.scene.objects if o.type=="MESH"]
def label(o): return (o.name+" "+o.data.name+" "+" ".join(m.name for m in o.data.materials if m)).lower()
def hair(o): return any(s in label(o) for s in ("hair","kami","髪"))
def bounds(obs):
    pts=[o.matrix_world@v.co for o in obs for v in o.data.vertices]
    return Vector([min(p[i] for p in pts) for i in range(3)]),Vector([max(p[i] for p in pts) for i in range(3)])
def mat(name,rgb,rough=.55):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF");p.inputs["Base Color"].default_value=(*rgb,1);p.inputs["Roughness"].default_value=rough
    return m
def mesh(name,verts,faces,mats,indices=None):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    for m in mats:d.materials.append(m)
    for i,p in enumerate(d.polygons):
        p.use_smooth=True
        if indices:p.material_index=indices[i]
    return o
def guide_spec(lo,hi):
    # Manually traced ratios from N4's front portrait and side/back design:
    # near-center part, tapered asymmetric fringe above pupils, cheek framing,
    # broad long S-shaped locks ending near waist. Coordinates in donor-head units.
    w=hi.x-lo.x;h=hi.z-lo.z;depth=hi.y-lo.y;c=(lo+hi)/2
    def P(x,y,z):return [c.x+x*w,c.y+y*depth,lo.z+z*h]
    g={}
    def add(name,points,width,thickness):g[name]={"points":[P(*p) for p in points],"width":width*w,"thickness":thickness*w}
    for i in range(9):
        u=i/8
        add("D11_fringe_%02d"%i,[(.02+.10*u,-.12,1.06),(.01+.25*u,-.40,1.00),(-.14+.42*u,-.56,.80),(-.18+.47*u,-.61,.64),(-.08+.48*u,-.57,.57+.17*abs(u-.46))],.075+.02*math.sin(math.pi*u),.032)
    for side in (-1,1):
        for i in range(5):
            u=i/4
            add("D11_frame_%s_%02d"%(side,i),[(.02+side*.08*u,-.08,1.07),(side*(.26+.10*u),-.38,1.00),(side*(.46+.08*u),-.48,.75),(side*(.53+.08*u),-.45,.37),(side*(.63+.08*u),-.31,-.04),(side*(.51+.11*u),-.44,-.44),(side*(.58+.10*u),-.48,-.92),(side*(.44+.12*u),-.46,-1.65-.15*u)],.125,.055)
    # radial rear locks, overlapping broad sections, not cylindrical strands
    for i in range(17):
        a=.95+(2*math.pi-1.9)*i/16
        pts=[(.10*math.sin(a),-.10*math.cos(a),1.07),(.43*math.sin(a),-.41*math.cos(a),.94),(.57*math.sin(a),-.55*math.cos(a),.56)]
        for j in range(1,6):
            t=j/5
            r=.57+.11*t+.07*math.sin(3*math.pi*t+a*.65)*t
            pts.append((r*math.sin(a)+.055*math.sin(3*math.pi*t+a)*t,-(.55+.20*t)*math.cos(a)+.06*math.sin(4*math.pi*t+a)*t,.56-2.65*t+.14*math.cos(a*3)*t))
        add("D11_back_%02d"%i,pts,.15,.065)
    return g
def prepare():
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    donor=next((TMP/"vroid").rglob("*.vrm"));glb=TMP/"donor.glb";shutil.copyfile(donor,glb)
    bpy.ops.import_scene.gltf(filepath=str(glb));bpy.context.view_layer.update()
    obs=mesh_objects()
    # VRM0 imports may carry active expressions; neutralize all morphs.
    for o in obs:
        if o.data.shape_keys:
            for k in list(o.data.shape_keys.key_blocks)[1:]:k.value=0
    for o in bpy.context.scene.objects:
        if o.type=="ARMATURE":
            for b in o.pose.bones:b.matrix_basis.identity()
    bpy.context.view_layer.update()
    face=[o for o in obs if not hair(o) and any(s in label(o) for s in ("face","head","顔"))]
    assert face,"No face found"
    lo,hi=bounds(face)
    assert hi.z-lo.z>0 and hi.x-lo.x>0
    old=[o for o in obs if hair(o)]
    assert old,"No donor hair to replace"
    for o in old:bpy.data.objects.remove(o,do_unlink=True)
    (OUT/"guides.json").write_text(json.dumps(guide_spec(lo,hi),indent=2))
    (OUT/"head.json").write_text(json.dumps({"lo":list(lo),"hi":list(hi),"donor":donor.name}))
def sample(points,n=8):
    out=[]
    for i in range(len(points)-1):
        a=points[max(0,i-1)];b=points[i];c=points[i+1];d=points[min(len(points)-1,i+2)]
        for j in range(n):
            t=j/n
            out.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
    return out+[points[-1]]
def attach_head(o):
    rigs=[r for r in bpy.context.scene.objects if r.type=="ARMATURE"]
    for r in rigs:
        candidates=[b for b in r.data.bones if b.name.lower() in ("head","j_bip_c_head") or b.name.lower().endswith("_head")]
        if candidates:
            mw=o.matrix_world.copy();o.parent=r;o.parent_type="BONE";o.parent_bone=candidates[0].name;o.matrix_world=mw
            return candidates[0].name
    raise RuntimeError("Head bone not found")
def construct():
    info=json.loads((OUT/"head.json").read_text());lo,hi=Vector(info["lo"]),Vector(info["hi"]);w=hi.x-lo.x;h=hi.z-lo.z;dep=hi.y-lo.y;c=(lo+hi)/2
    g=json.loads((OUT/"guides.json").read_text())
    palette=[mat("N4 warm dark brown "+str(i),v) for i,v in enumerate([(.040,.026,.033),(.065,.041,.050),(.090,.058,.069),(.120,.080,.091),(.075,.047,.056)])]
    # continuous scalp shell, with a high front hairline and coverage around back
    verts=[];faces=[];N=96;R=25
    for j in range(R+1):
        t=.008+(j/R)*.992
        for i in range(N):
            a=2*math.pi*i/N
            end=1.30+.70*(1-math.cos(a))/2
            q=t*end
            verts.append((c.x+.56*w*math.sin(q)*math.sin(a),c.y-.57*dep*math.sin(q)*math.cos(a),lo.z+h*(.48+.62*math.cos(q))))
    for j in range(R):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;faces.append((a,b,b+N,a+N))
    cap=mesh("D11 continuous scalp",verts,faces,[palette[0]])
    bone=attach_head(cap)
    made=[]
    for name,spec in g.items():
        guide=bpy.data.objects.get(name)
        assert guide and guide.type=="CURVE",f"MCP guide missing: {name}"
        sp=guide.data.splines[0];points=[guide.matrix_world@Vector(p.co[:3]) for p in sp.points]
        assert len(points)>=4
        path=sample(points);verts=[];faces=[];ids=[];K=12
        for j,p in enumerate(path):
            t=j/(len(path)-1);tangent=(path[min(j+1,len(path)-1)]-path[max(j-1,0)]).normalized()
            # Flattened oval cross-section with outward-facing broad surface.
            outward=Vector((p.x-c.x,p.y-c.y,0))
            if outward.length<1e-6:outward=Vector((0,-1,0))
            outward=(outward-tangent*outward.dot(tangent)).normalized()
            side=tangent.cross(outward).normalized()
            width=spec["width"]*(.42+.58*math.sin(math.pi*t)**.48)*max(.035,min(1,(1-t)/.17))
            thick=spec["thickness"]*max(.08,min(1,(1-t)/.18))
            for i in range(K):
                a=2*math.pi*i/K
                verts.append(tuple(p+side*(width*math.sin(a))+outward*(thick*math.cos(a))))
        for j in range(len(path)-1):
            for i in range(K):
                a=j*K+i;b=j*K+(i+1)%K;faces.append((a,b,b+K,a+K))
                ids.append([3,2,1,0,0,0,0,0,0,1,2,3][i])
        faces.extend([tuple(reversed(range(K))),tuple(range((len(path)-1)*K,len(path)*K))]);ids.extend([0,0])
        o=mesh(name+"_sculpted",verts,faces,palette,ids);attach_head(o);made.append(o.name)
        bpy.data.objects.remove(guide,do_unlink=True)
    bpy.context.view_layer.update()
    allmesh=mesh_objects()
    report={"donor":info["donor"],"head_bone":bone,"mcp_guides_consumed":len(made),"hair_meshes":made,"neutral_shape_keys":True,"reference":"manually traced proportions; original image excluded","clothing":"original donor clothing, NOT final N4 uniform","landmark_error":"not measured","visual_acceptance":"pending","objects":[{"name":o.name,"vertices":len(o.data.vertices),"triangles":sum(len(p.vertices)-2 for p in o.data.polygons),"shape_keys":len(o.data.shape_keys.key_blocks)-1 if o.data.shape_keys else 0} for o in allmesh]}
    assert len(made)==len(g)
    assert any(o.type=="ARMATURE" for o in bpy.context.scene.objects)
    (OUT/"metrics.json").write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"D11.blend"))
    bpy.ops.export_scene.gltf(filepath=str(OUT/"D11.glb"),export_format="GLB")
    (OUT/"build.done").touch()
def render():
    info=json.loads((OUT/"head.json").read_text());lo,hi=Vector(info["lo"]),Vector(info["hi"]);c=(lo+hi)/2;w=hi.x-lo.x;h=hi.z-lo.z
    scene=bpy.context.scene;scene.render.engine="CYCLES";scene.cycles.samples=16
    scene.render.resolution_x=720;scene.render.resolution_y=960;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new("N4 studio");scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.18,.18,.18,1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value=.65
    scene.view_settings.view_transform="Standard"
    def aim(o,p):o.rotation_euler=(p-o.location).to_track_quat("-Z","Y").to_euler()
    for pos,energy in [((-3,-4,5),60),((3,-2,2),35),((0,4,4),70)]:
        d=bpy.data.lights.new("Studio","AREA");d.energy=energy*w*w;d.size=3*w
        o=bpy.data.objects.new("Studio",d);scene.collection.objects.link(o);o.location=c+Vector(pos)*w;aim(o,c)
    cam=bpy.data.objects.new("Camera",bpy.data.cameras.new("Camera"));scene.collection.objects.link(cam);scene.camera=cam;cam.data.type="ORTHO"
    for shot in ("head","full"):
        if shot=="head":target=c-Vector((0,0,.20*h));scale=2.9*h
        else:
            a,b=bounds(mesh_objects());target=(a+b)/2;scale=(b.z-a.z)*1.12
        cam.data.ortho_scale=scale
        for angle in (0,45,90,180):
            a=math.radians(angle);cam.location=target+Vector((math.sin(a),-math.cos(a),0))*max(w*12,scale*2);aim(cam,target)
            scene.render.filepath=str(OUT/f"D11_{shot}_{angle:03}.png");bpy.ops.render.render(write_still=True)
def poll():
    if not (OUT/"build.request").exists():return 1.0
    try:construct()
    except Exception:(OUT/"build.error").write_text(traceback.format_exc());raise
    return None
if os.getenv("N4_RENDER")=="1":render()
else:
    prepare()
    bpy.app.timers.register(poll,first_interval=1.0)
