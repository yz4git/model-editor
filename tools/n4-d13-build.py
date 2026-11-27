"""D13: full-body VRoid donor with reference-authored hair. No reference image in CI."""
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
def guide_spec(lo,hi,back_y):
    # Manually traced ratios from N4's front portrait and side/back design:
    # near-center part, tapered asymmetric fringe above pupils, cheek framing,
    # broad long S-shaped locks ending near waist. Coordinates in donor-head units.
    w=hi.x-lo.x;h=hi.z-lo.z;depth=hi.y-lo.y;c=(lo+hi)/2
    def P(x,y,z):return [c.x+x*w,c.y-y*(depth if y<0 else max(depth,(c.y-back_y)/.54)),lo.z+z*h]
    g={}
    def add(name,points,width,thickness):g[name]={"points":[P(*p) for p in points],"width":width*w,"thickness":thickness*w}
    for i in range(15):
        u=i/14
        x=-.43+.86*u
        side=-1 if x<-.035 else 1
        root=-.035+side*(.015+.06*abs(x))
        end=.57+.17*(abs(x)/.43)**1.6+.07*math.sin(i*2.1)
        add("D13_fringe_%02d"%i,[(root,-.14,1.08),(root*.65+x*.35,-.44,1.02),(x*.68,-.66,.83),(x*.95,-.69,end+.12),(x+side*.035,-.70,end)],.032+.010*math.sin(math.pi*u),.015)
    for side in (-1,1):
        for i in range(5):
            u=i/4
            add("D13_frame_%s_%02d"%(side,i),[(.02+side*.08*u,-.08,1.07),(side*(.26+.10*u),-.38,1.00),(side*(.46+.08*u),-.48,.75),(side*(.53+.08*u),-.45,.37),(side*(.63+.08*u),-.31,-.04),(side*(.51+.11*u),-.44,-.44),(side*(.58+.10*u),-.48,-.92),(side*(.44+.12*u),-.46,-1.65-.15*u)],.125,.055)
    # radial rear locks, overlapping broad sections, not cylindrical strands
    for i in range(17):
        a=.95+(2*math.pi-1.9)*i/16
        pts=[(.10*math.sin(a),-.10*math.cos(a),1.07),(.43*math.sin(a),-.41*math.cos(a),.94),(.57*math.sin(a),-.55*math.cos(a),.56)]
        for j in range(1,6):
            t=j/5
            r=.57+.11*t+.07*math.sin(3*math.pi*t+a*.65)*t
            pts.append((r*math.sin(a)+.055*math.sin(3*math.pi*t+a)*t,-(.55+.20*t)*math.cos(a)+.06*math.sin(4*math.pi*t+a)*t,.56-2.65*t+.14*math.cos(a*3)*t))
        add("D13_back_%02d"%i,pts,.15,.065)
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
    # Verify forward direction directly against donor iris geometry.
    eye_points=[]
    for o in face:
        for p in o.data.polygons:
            m=o.data.materials[p.material_index]
            if m and "eyeiris" in m.name.lower():
                eye_points.extend(o.matrix_world@o.data.vertices[i].co for i in p.vertices)
    assert eye_points,"No iris geometry"
    mid=(lo+hi)/2
    eye_y=sum(p.y for p in eye_points)/len(eye_points)
    assert eye_y>mid.y,"Donor does not face +Y"
    w=hi.x-lo.x;h=hi.z-lo.z;dep=hi.y-lo.y
    centers=[]
    for sign in (-1,1):
        ep=[p for p in eye_points if sign*(p.x-mid.x)>0]
        if ep:centers.append(sum(ep,Vector((0,0,0)))/len(ep))
    def deform(p):
        q=p.copy(); z=(p.z-lo.z)/h
        f=max(0,min(1,(p.y-mid.y)/(dep*.30)))
        jaw=max(0,1-z/.48)**1.4
        q.x=mid.x+(p.x-mid.x)*(1-.12*jaw)
        eye=math.exp(-((z-.40)/.11)**2)*f
        q.x=mid.x+(q.x-mid.x)*(1-.07*eye)
        q.z+=h*.025*eye-h*.022*math.exp(-((z-.20)/.10)**2)*f
        for ec in centers:
            dx=(p.x-ec.x)/(w*.23);dz=(p.z-ec.z)/(h*.17)
            influence=math.exp(-1.7*(dx*dx+dz*dz))*f
            q.z-=.28*(p.z-ec.z)*influence
            q.x+=.08*(p.x-ec.x)*influence
        mouth=math.exp(-((z-.18)/.07)**2)*f*math.exp(-((p.x-mid.x)/(w*.20))**2)
        q.x+=(p.x-mid.x)*.18*mouth
        return q
    for o in face:
        mw=o.matrix_world.copy();inv=mw.inverted()
        if o.data.shape_keys:
            for k in o.data.shape_keys.key_blocks:
                for v in k.data:v.co=inv@deform(mw@v.co)
        else:
            for v in o.data.vertices:v.co=inv@deform(mw@v.co)
        o.data.update()
    bpy.context.view_layer.update()
    # Body skin includes the rear cranium omitted from the Face object's bounds.
    cranial=[o.matrix_world@v.co for o in obs if not hair(o) for v in o.data.vertices if (o.matrix_world@v.co).z>lo.z+.25*h]
    assert cranial
    back_y=min(v.y for v in cranial)
    old=[o for o in obs if hair(o)]
    assert old,"No donor hair to replace"
    for o in old:bpy.data.objects.remove(o,do_unlink=True)
    (OUT/"guides.json").write_text(json.dumps(guide_spec(lo,hi,back_y),indent=2))
    (OUT/"head.json").write_text(json.dumps({"lo":list(lo),"hi":list(hi),"donor":donor.name,"back_y":back_y}))
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
    palette=[mat("N4 warm dark brown "+str(i),v) for i,v in enumerate([(.038,.025,.034),(.058,.038,.048),(.085,.055,.067),(.119,.078,.092),(.070,.045,.055)])]
    # continuous scalp shell, with a high front hairline and coverage around back
    from mathutils.bvhtree import BVHTree
    # Raycast onto actual skin, including the body rear cranium.
    sv=[];sf=[]
    for ob in mesh_objects():
        if hair(ob):continue
        offset=len(sv);sv.extend(ob.matrix_world@v.co for v in ob.data.vertices)
        for poly in ob.data.polygons:
            m=ob.data.materials[poly.material_index]
            if m and "skin" in m.name.lower() and all(sv[offset+i].z>lo.z-h*.05 for i in poly.vertices):
                sf.append(tuple(offset+i for i in poly.vertices))
    assert sf,"No cranium skin polygons"
    bvh=BVHTree.FromPolygons(sv,sf)
    origin=Vector((c.x,(info["back_y"]+hi.y)*.5,lo.z+.52*h))
    verts=[];faces=[];N=120;R=40;min_clearance=1e9
    for j in range(R+1):
        t=.008+(j/R)*.992
        for i in range(N):
            a=2*math.pi*i/N
            end=1.04+1.36*(1-math.cos(a))/2
            q=t*end
            nominal=Vector((c.x+.56*w*math.sin(q)*math.sin(a),origin.y+(hi.y-info["back_y"])*.57*math.sin(q)*math.cos(a),lo.z+h*(.52+.59*math.cos(q))))
            direction=(nominal-origin).normalized()
            hit,normal,index,dist=bvh.ray_cast(origin+direction*h*2,-direction,h*2)
            if hit is not None:
                radius=max((nominal-origin).length,(hit-origin).dot(direction)+h*.025)
                point=origin+direction*radius
                min_clearance=min(min_clearance,(point-hit).dot(direction))
            else:point=nominal
            verts.append(tuple(point))
    for j in range(R):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;faces.append((a,b,b+N,a+N))
    cap=mesh("D13 cranium conformal scalp",verts,faces,[palette[0]])
    bpy.ops.object.select_all(action="DESELECT");bpy.context.view_layer.objects.active=cap;cap.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT");bpy.ops.mesh.select_all(action="SELECT");bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode="OBJECT");cap.select_set(False)
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
    report={"donor":info["donor"],"head_bone":bone,"scalp_ray_min_clearance":min_clearance,"mcp_guides_consumed":len(made),"hair_meshes":made,"neutral_shape_keys":True,"reference":"manually traced proportions; original image excluded","clothing":"original donor clothing, NOT final N4 uniform","landmark_error":"not measured","orientation":"verified against iris positions; +Y forward","face_deformation":"shared smooth field on base and morphs","visual_acceptance":"pending","objects":[{"name":o.name,"vertices":len(o.data.vertices),"triangles":sum(len(p.vertices)-2 for p in o.data.polygons),"shape_keys":len(o.data.shape_keys.key_blocks)-1 if o.data.shape_keys else 0} for o in allmesh]}
    assert len(made)==len(g)
    assert any(o.type=="ARMATURE" for o in bpy.context.scene.objects)
    (OUT/"metrics.json").write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"D13.blend"))
    bpy.ops.export_scene.gltf(filepath=str(OUT/"D13.glb"),export_format="GLB")
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
    for pos,energy in [((-3,4,5),60),((3,2,2),35),((0,-4,4),70)]:
        d=bpy.data.lights.new("Studio","AREA");d.energy=energy*w*w;d.size=3*w
        o=bpy.data.objects.new("Studio",d);scene.collection.objects.link(o);o.location=c+Vector(pos)*w;aim(o,c)
    cam=bpy.data.objects.new("Camera",bpy.data.cameras.new("Camera"));scene.collection.objects.link(cam);scene.camera=cam;cam.data.type="ORTHO"
    for shot in ("head","full"):
        if shot=="head":target=c-Vector((0,0,.20*h));scale=2.9*h
        else:
            a,b=bounds(mesh_objects());target=(a+b)/2;scale=(b.z-a.z)*1.12
        cam.data.ortho_scale=scale
        for angle in (0,45,90,180):
            a=math.radians(angle);cam.location=target+Vector((math.sin(a),math.cos(a),0))*max(w*12,scale*2);aim(cam,target)
            scene.render.filepath=str(OUT/f"D13_{shot}_{angle:03}.png");bpy.ops.render.render(write_still=True)
def poll():
    if not (OUT/"build.request").exists():return 1.0
    try:construct()
    except Exception:(OUT/"build.error").write_text(traceback.format_exc());raise
    return None
if os.getenv("N4_RENDER")=="1":render()
else:
    prepare()
    bpy.app.timers.register(poll,first_interval=1.0)
