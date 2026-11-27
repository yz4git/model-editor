# N4 D08: independent reference-proportion head study, built from actual MCP guide curves.
import bpy, math, os, json, traceback
from mathutils import Vector
from pathlib import Path
from math import sin,cos,pi,sqrt,exp
OUT=Path(os.environ["BLENDER_ASSETS_DIR"])
VARIANT=os.getenv("N4_VARIANT","A")
V={"A":(1.0,1.0,1.0),"B":(.96,.94,1.12),"C":(1.035,1.06,.88)}[VARIANT]
OUT.mkdir(parents=True,exist_ok=True)
def mat(name,c,r=.5,vertex=False):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF");p.inputs["Base Color"].default_value=(*c,1);p.inputs["Roughness"].default_value=r
    if vertex:
        a=m.node_tree.nodes.new("ShaderNodeVertexColor");a.layer_name="Color";m.node_tree.links.new(a.outputs["Color"],p.inputs["Base Color"])
    return m
def mesh(name,vs,fs,m,cols=None):
    d=bpy.data.meshes.new(name);d.from_pydata(vs,[],fs);d.update()
    o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);o.data.materials.append(m)
    for p in d.polygons:p.use_smooth=True
    if cols:
        a=d.color_attributes.new(name="Color",type="FLOAT_COLOR",domain="POINT")
        for c,v in zip(a.data,cols):c.color=(*v,1)
    return o
def lerp(a,b,t):return a+(b-a)*t
def interp(profile,z):
    for i in range(len(profile)-1):
        a,b=profile[i],profile[i+1]
        if a[0]<=z<=b[0]:
            h=b[0]-a[0];t=(z-a[0])/h
            p=profile[max(0,i-1)];q=profile[min(len(profile)-1,i+2)]
            vals=[]
            for j in range(1,len(a)):
                d=(b[j]-a[j])/h
                d0=(a[j]-p[j])/max(a[0]-p[0],1e-9) if i else d
                d1=(q[j]-b[j])/max(q[0]-b[0],1e-9) if i<len(profile)-2 else d
                m0=2*d*d0/(d+d0) if d*d0>0 else 0
                m1=2*d*d1/(d+d1) if d*d1>0 else 0
                vals.append((2*t**3-3*t*t+1)*a[j]+(t**3-2*t*t+t)*h*m0+(-2*t**3+3*t*t)*b[j]+(t**3-t*t)*h*m1)
            return tuple(vals)
    return profile[0][1:] if z<profile[0][0] else profile[-1][1:]
# z, half width, front depth, back depth; dimensions in head-width study units
PROFILE=[(0,.018,.27,.11),(.07,.20,.41,.29),(.19,.44,.53,.46),(.36,.64,.59,.60),(.60,.80,.65,.73),(.87,.91,.70,.81),(1.13,.98,.70,.87),(1.36,.98,.68,.91),(1.61,.94,.72,.96),(1.86,.91,.76,.99),(2.10,.85,.75,.97),(2.34,.66,.60,.78),(2.50,.40,.39,.49),(2.59,.018,.04,.05)]
PROFILE=[(z,w*(V[0] if z<1.5 else 1),f,b) for z,w,f,b in PROFILE]
def ga(x,z,a,b,sx,sz):return exp(-((x-a)/sx)**2-((z-b)/sz)**2)
def front(x,z):
    w,f,b=interp(PROFILE,z);q=min(.999,abs(x)/max(w,.001))
    depth=f*sqrt(1-q*q)
    depth+=.095*V[1]*ga(x,z,0,1.00,.135,.14)+.064*ga(x,z,0,1.22,.12,.31)
    depth+=.024*(ga(x,z,.105,.96,.075,.075)+ga(x,z,-.105,.96,.075,.075))
    depth-=.037*(ga(x,z,.43,1.30,.30,.15)+ga(x,z,-.43,1.30,.30,.15))
    depth+=.036*ga(x,z,0,.58,.38,.16)+.021*ga(x,z,0,.20,.27,.10)
    return -depth
def skincol(x,z,fac):
    blush=(ga(x,z,.66,1.00,.30,.22)+ga(x,z,-.66,1.00,.30,.22))*fac
    nose=ga(x,z,0,1.01,.17,.15)*fac
    return (.91,.60-.075*blush-.035*nose,.53-.055*blush-.02*nose)
def loft_head(skin):
    vs=[];fs=[];cs=[];N=112;R=104
    for j in range(R+1):
        z=2.59*j/R;w,f,b=interp(PROFILE,z)
        for i in range(N):
            a=2*pi*i/N;x=w*sin(a);c=cos(a);y=front(x,z) if c>=0 else -b*c
            vs.append((x,y,z));cs.append(skincol(x,z,max(0,c)))
    for j in range(R):
        for i in range(N):
            a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
    fs.append(tuple(reversed(range(N))));fs.append(tuple(R*N+i for i in range(N)))
    return mesh("D08_Head_IndependentLoft",vs,fs,skin,cs)
def strip(name,points,radii,m,sides=10):
    vs=[];fs=[];cols=[]
    for i,p in enumerate(points):
        t=(points[min(i+1,len(points)-1)]-points[max(i-1,0)]).normalized()
        n=Vector((0,-1,0));u=t.cross(n)
        if u.length<.0001:u=t.cross(Vector((1,0,0)))
        u.normalize();v=t.cross(u).normalized()
        for k in range(sides):
            a=2*pi*k/sides;vs.append(tuple(p+radii[i]*(u*cos(a)+v*sin(a))))
    for i in range(len(points)-1):
        for k in range(sides):
            a=i*sides+k;b=i*sides+(k+1)%sides;fs.append((a,b,b+sides,a+sides))
    fs+=[tuple(reversed(range(sides))),tuple((len(points)-1)*sides+i for i in range(sides))]
    return mesh(name,vs,fs,m)
def catmull(ps,n=12):
    a=[]
    for k in range(len(ps)-1):
        p0,p1,p2,p3=ps[max(0,k-1)],ps[k],ps[k+1],ps[min(len(ps)-1,k+2)]
        for j in range(n):
            t=j/n;a.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
    return a+[ps[-1]]
def eyes(side,white,lid,lash,iris,catch):
    cx=side*.435;cz=1.30;vs=[];fs=[];cs=[];n=144;h=60
    # Almond-shaped exposed eyeball surface with separately colored iris.
    for j in range(h+1):
        v=2*j/h-1
        for i in range(n+1):
            u=2*i/n-1;x=cx+.270*u
            z=cz+side*.023*u+( .135 if v>=0 else .100)*v*max(0,1-u*u)**.61
            bulge=.043*max(0,1-u*u)*max(0,1-v*v)
            y=front(x,z)-.009-bulge
            rr=sqrt(((x-cx)/(.155*V[2]))**2+((z-cz-.003)/(.155*V[2]))**2);ang=math.atan2(z-cz,x-cx)
            k=.90+.14*sin(ang*51+rr*15)+.07*cos(ang*93)
            iris=(.22*k,.114*k,.086*k)
            def smooth(a,b,x):
                t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
            dark=(.018,.009,.012);rim=(.052,.027,.028);sclera=(.83,.68-.09*abs(v),.65-.08*abs(v))
            f=smooth(.41,.49,rr);c=tuple(lerp(a,b,f) for a,b in zip(dark,iris))
            f=smooth(.84,.98,rr);c=tuple(lerp(a,b,f) for a,b in zip(c,rim))
            f=smooth(.97,1.035,rr);c=tuple(lerp(a,b,f) for a,b in zip(c,sclera))
            vs.append((x,y,z));cs.append(c)
    for j in range(h):
        for i in range(n):
            a=j*(n+1)+i;fs.append((a,a+1,a+n+2,a+n+1))
    mesh("D08_Eye_"+str(side),vs,fs,white,cs)
    for upper in (True,False):
        pts=[]
        for i in range(51):
            u=2*i/50-1;x=cx+.270*u;z=cz+side*.023*u+(.135 if upper else -.100)*max(0,1-u*u)**.61
            pts.append(Vector((x,front(x,z)-.011,z)))
        strip("D08_Lid_%s_%s"%(side,upper),pts,[(.004+(.014 if upper else .004)*sin(pi*i/50)**.7) for i in range(51)],lash if upper else lid)
        if upper:
            for k in range(7):
                u=side*(.16+.105*k);x=cx+.270*u;z=cz+side*.023*u+.135*max(0,1-u*u)**.61;y=front(x,z)-.024
                p=catmull([Vector((x,y,z)),Vector((x+side*.036,y-.016,z+.026)),Vector((x+side*(.055+.004*k),y-.019,z+.052+.004*k))],5)
                strip("D08_Lash_%s_%s"%(side,k),p,[.007*(1-i/(len(p)-1))+.0005 for i in range(len(p))],lash,6)
    # Two small specular accents on the iris surface.
    for dx,dz,s in [(-.043,.038,.021),(.034,-.032,.009)]:
        x=cx+dx;z=cz+dz;y=front(x,z)-.056
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=s,location=(x,y,z));o=bpy.context.object;o.name="D08_IrisCatch";o.scale=(1,.16,1);o.data.materials.append(catch)
def mouth(m,crease):
    for upper in (True,False):
        vs=[];fs=[];cs=[];N=72;H=10
        for j in range(H+1):
            v=j/H
            for i in range(N+1):
                u=2*i/N-1;x=.322*u;mid=.58+.034*abs(u)**2
                envelope=max(0,1-u*u)**.75
                z=mid+( .043*(.79+.21*cos(u*pi*3)) if upper else -.058)*envelope*v
                y=front(x,z)-(.006+.026*sin(pi*v)*envelope)
                vs.append((x,y,z));cs.append((.69+.09*v,.32+.10*v,.31+.10*v) if upper else (.76+.08*sin(pi*v),.40+.10*sin(pi*v),.38+.10*sin(pi*v)))
        for j in range(H):
            for i in range(N):
                a=j*(N+1)+i;fs.append((a,a+1,a+N+2,a+N+1))
        mesh("D08_Lip_"+str(upper),vs,fs,m,cs)
    p=[Vector((.322*u,front(.322*u,.58+.034*abs(u)**2)-.008,.58+.034*abs(u)**2)) for u in [2*i/64-1 for i in range(65)]]
    strip("D08_MouthSeam",p,[.0015+.003*sin(pi*i/64) for i in range(65)],crease,8)
def haircol(u,t,seed):
    k=.84+.23*cos(u*1.8)+.10*sin(u*18+seed)+.06*sin(u*47+seed*2)+.10*sin(t*5+seed)
    return (.061*k,.037*k,.051*k)
def cap(hm):
    vs=[];fs=[];cs=[];N=128;R=72
    # continuous rear and crown shell; front edge sits above the fringe.
    for j in range(R+1):
        t=j/R
        for i in range(N+1):
            a=2*pi*i/N;fr=max(0,cos(a));theta=(.025+(1.62-.65*fr)*t)
            x=1.09*sin(theta)*sin(a);y=.065-.99*sin(theta)*cos(a);z=1.64+1.02*cos(theta)
            vs.append((x,y,z));cs.append(haircol(a*5,t,0))
    for j in range(R):
        for i in range(N):
            a=j*(N+1)+i;fs.append((a,a+1,a+N+2,a+N+1))
    mesh("D08_Crown",vs,fs,hm,cs)
    vs=[];fs=[];cs=[];N=100;R=90
    for j in range(R+1):
        t=j/R
        for i in range(N+1):
            a=.83+(2*pi-1.66)*i/N
            w=1.06+.25*t+.10*sin(3*pi*t)*t
            x=w*sin(a)+.07*sin(4*pi*t+a*2)*t;y=.08-(.94+.13*t)*cos(a)+.12*sin(3*pi*t+a)*t;z=1.86-5.0*t+.22*sin(7*a)*t**5
            vs.append((x,y,z));cs.append(haircol(a*5,t,3))
    for j in range(R):
        for i in range(N):
            a=j*(N+1)+i;fs.append((a,a+1,a+N+2,a+N+1))
    mesh("D08_BackHair_Underlayer",vs,fs,hm,cs)
def ribbon(guide,hm,width,seed):
    ps=[Vector(p.co[:3]) for p in guide.data.splines[0].points]
    pts=catmull(ps,14);vs=[];fs=[];cs=[];N=16
    for i,p in enumerate(pts):
        t=i/(len(pts)-1);tangent=(pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]).normalized()
        radial=Vector((p.x,p.y-.08,0))
        if "fringe" in guide.name:radial=Vector((p.x*.4,-1,0))
        if radial.length<.001:radial=Vector((0,-1,0))
        radial.normalize();u=tangent.cross(radial)
        if u.length<.001:u=tangent.cross(Vector((0,0,1)))
        u.normalize();v=u.cross(tangent).normalized()
        w=width*(.10+.90*sin(pi*min(.95,t+.04))**.62)*(max(.0007,1-t)**.42)
        if "fringe" in guide.name:w*=.92 if VARIANT=="A" else 1.10 if VARIANT=="B" else .81
        for k in range(N):
            a=2*pi*k/N;vs.append(tuple(p+w*(u*cos(a)+v*sin(a)*(.12 if "fringe" in guide.name else .17))));cs.append(haircol(a,t,seed))
    for i in range(len(pts)-1):
        for k in range(N):
            a=i*N+k;b=i*N+(k+1)%N;fs.append((a,b,b+N,a+N))
    fs+=[tuple(reversed(range(N))),tuple((len(pts)-1)*N+i for i in range(N))]
    mesh("D08_Lock_"+guide.name,vs,fs,hm,cs)
def build():
    skin=mat("D08_Skin",(.91,.58,.49),.46,True);p=skin.node_tree.nodes.get("Principled BSDF")
    if "Subsurface Weight" in p.inputs:p.inputs["Subsurface Weight"].default_value=.09
    white=mat("D08_EyePigment",(.8,.7,.65),.28,True);lid=mat("D08_LowerLid",(.69,.36,.34),.6);lash=mat("D08_Lash",(.035,.012,.022),.43);catch=mat("D08_Catchlight",(.99,.94,.90),.2)
    lips=mat("D08_Lips",(.65,.25,.25),.32,True);crease=mat("D08_MouthCrease",(.16,.045,.051),.52)
    hm=mat("D08_Hair",(.061,.037,.051),.48,True);p=hm.node_tree.nodes.get("Principled BSDF")
    if "Anisotropic" in p.inputs:p.inputs["Anisotropic"].default_value=.55
    loft_head(skin)
    for side in (-1,1):
        eyes(side,white,lid,lash,None,catch)
        pts=[]
        for i in range(41):
            u=2*i/40-1;x=side*.43+.27*u;z=1.68+.06*(1-u*u)+side*.018*u;pts.append(Vector((x,front(x,z)-.012,z)))
        strip("D08_Brow_"+str(side),pts,[.008+.017*sin(pi*i/40)**.8 for i in range(41)],lash,8)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(side*.94,.05,1.10));o=bpy.context.object;o.name="D08_Ear";o.scale=(.16,.13,.25);o.data.materials.append(mat("Ear"+str(side),(.83,.44,.38),.5))
    mouth(lips,crease)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(0,.11,-.38));o=bpy.context.object;o.name="D08_Neck";o.scale=(.37,.35,.67);o.data.materials.append(mat("Neck",(.91,.58,.49),.46))
    cap(hm)
    guides=[o for o in bpy.data.objects if o.name.startswith("MCP_") and o.type=="CURVE"]
    assert len(guides)>=15, len(guides)
    for i,o in enumerate(sorted(guides,key=lambda o:o.name)):
        ribbon(o,hm,(.105 if "fringe" in o.name else .22 if "side" in o.name else .23),i*.71)
        o.hide_render=True;o.hide_set(True)
    model=[o for o in bpy.context.scene.objects if o.name.startswith("D08_") and o.type=="MESH"]
    for o in model:
        o.select_set(True)
    for o in bpy.context.selected_objects:
        if o not in model:o.select_set(False)
    bpy.context.view_layer.objects.active=model[0]
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"N4_D09_head_study.blend"))
    bpy.ops.export_scene.gltf(filepath=str(OUT/"N4_D09_head_study.glb"),use_selection=True,export_format="GLB")
    report={"guide_count":len(guides),"mesh_count":len(model),"vertices":sum(len(o.data.vertices) for o in model),"triangles":sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in model),"blender":bpy.app.version_string,"variant":VARIANT,"scope":"independent unrigged head study; no D07 geometry or animation imported"}
    (OUT/"model_report.json").write_text(json.dumps(report,indent=2))
def poll():
    if not (OUT/"build.request").exists():return .25
    try:
        build();(OUT/"build.done").write_text("ok")
    except Exception:
        (OUT/"build.error").write_text(traceback.format_exc())
    return None
def render():
    scene=bpy.context.scene
    scene.render.engine="CYCLES";scene.cycles.samples=28;scene.cycles.use_denoising=True
    scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
    scene.world.color=(.12,.12,.12)
    scene.view_settings.view_transform="AgX"
    for name,loc,energy,size in [("Key",(-4,-6,5),650,4),("Fill",(4,-4,2),350,5),("Rim",(0,3,4),420,4)]:
        d=bpy.data.lights.new(name,"AREA");d.energy=energy;d.shape="DISK";d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat("-Z","Y").to_euler()
    d=bpy.data.cameras.new("Studio");o=bpy.data.objects.new("Studio",d);scene.collection.objects.link(o);scene.camera=o;d.type="ORTHO";d.ortho_scale=4.0
    for angle in [0,45,90,180]:
        a=math.radians(angle);target=Vector((0,0,.80));o.location=target+Vector((9*sin(a),-9*cos(a),.02));o.rotation_euler=(target-o.location).to_track_quat("-Z","Y").to_euler()
        scene.render.filepath=str(OUT/("D09_%03d.png"%angle));bpy.ops.render.render(write_still=True)
if os.getenv("N4_RENDER")=="1":render()
else:
    for o in list(bpy.context.scene.objects):bpy.data.objects.remove(o,do_unlink=True)
    bpy.app.timers.register(poll,first_interval=.5)
