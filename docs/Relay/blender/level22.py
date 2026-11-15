"""Relay: Level 22 floor plate, rendered with Blender (bpy). Run: python3 level22.py
Outputs level22.png (transparent) and level22_labels.json (projected label positions)."""
import bpy, math, json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
S=20.0
def P(x,y,z=0): return Vector(((x-170)/S, -(y-115)/S, z))   # svg px -> blender units
def lin(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return (f(r),f(g),f(b),1)
mats={}
def mat(name,hexc,rough=.55,emit=0):
    if name in mats: return mats[name]
    m=bpy.data.materials.new(name); m.use_nodes=True; n=m.node_tree.nodes; n.clear()
    out=n.new('ShaderNodeOutputMaterial')
    if emit:
        e=n.new('ShaderNodeEmission'); e.inputs['Color'].default_value=lin(hexc); e.inputs['Strength'].default_value=emit
        m.node_tree.links.new(e.outputs[0],out.inputs[0])
    else:
        b=n.new('ShaderNodeBsdfPrincipled'); b.inputs['Base Color'].default_value=lin(hexc); b.inputs['Roughness'].default_value=rough
        m.node_tree.links.new(b.outputs[0],out.inputs[0])
    mats[name]=m; return m
def box(name,x0,y0,x1,y1,z0,z1,m):
    a=P(x0,y0); b=P(x1,y1)
    cx,cy=(a.x+b.x)/2,(a.y+b.y)/2; sx,sy=abs(b.x-a.x),abs(b.y-a.y)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,cy,(z0+z1)/2))
    o=bpy.context.object; o.name=name; o.scale=(sx,sy,z1-z0); o.data.materials.append(m)
    bev=o.modifiers.new('b','BEVEL'); bev.width=0.04; bev.segments=2
    return o
NAVY,NAVY2,MIST,MIST2,SLATE,ORANGE,LINE='#14213D','#22335A','#E5ECF2','#F3F6F9','#4B5B78','#FF5A1F','#C9D4DF'
# slab and walls
box('slab',6,6,334,224,-0.45,0,mat('slab','#D3DEE8',.85))
box('slab_edge',2,2,338,228,-0.7,-0.45,mat('edge',NAVY,.5))
w=mat('wall',NAVY2,.5)
for nm,(x0,y0,x1,y1) in dict(n=(6,6,334,10),s=(6,220,334,224),w=(6,6,10,224),e=(330,6,334,224)).items():
    box('wall_'+nm,x0,y0,x1,y1,0,0.55,w)
# rooms partitions (matches the 2D plan)
pm=mat('part',LINE,.7)
for x in (60,110,230,280):
    box(f'pn{x}',x-1.5,10,x+1.5,60,0,0.4,pm); box(f'ps{x}',x-1.5,170,x+1.5,220,0,0.4,pm)
# core + Bomba lift lobby
box('core',120,80,220,150,0,0.5,mat('core',MIST,.7))
box('core_top',124,84,216,146,0.5,0.54,mat('coretop',LINE,.8))
box('lift',145,120,195,142,0.54,0.95,mat('lift',SLATE,.5))
# stairwells
st=mat('stair',NAVY,.45)
box('stairA',16,66,60,110,0,1.0,st); box('stairB',280,120,324,164,0,1.0,st)
steps=mat('steps',MIST,.6)
for i in range(6):
    h=1.0+0.13*(i+1)
    box(f'sa{i}',20+i*6.5,70,26.5+i*6.5,106,1.0,h,steps)
    box(f'sb{i}',284+i*6.5,124,290.5+i*6.5,160,1.0,h,steps)
# waiting point ring (slate) beside stairwell B
bpy.ops.mesh.primitive_cylinder_add(radius=0.62,depth=0.04,location=P(286,176,0.03)); wp=bpy.context.object; wp.data.materials.append(mat('wp',SLATE,.5))
bpy.ops.mesh.primitive_cylinder_add(radius=0.42,depth=0.05,location=P(286,176,0.04)); wp2=bpy.context.object; wp2.data.materials.append(mat('wp2',MIST2,.5))
# route: You -> Stairwell A (dashes + arrow)
em=mat('route',ORANGE,emit=2.2)
pts=[(170,54),(170,72),(98,72)]
for (x0,y0),(x1,y1) in zip(pts,pts[1:]):
    a,b=P(x0,y0),P(x1,y1); L=(b-a).length; d=(b-a).normalized(); n=int(L/0.75)
    for i in range(n):
        c=a+d*(0.4+i*0.75)
        if (c-a).length>L-0.2: break
        bpy.ops.mesh.primitive_cube_add(size=1,location=(c.x,c.y,0.05)); o=bpy.context.object
        o.scale=(0.55 if abs(d.x)>.5 else 0.24, 0.55 if abs(d.y)>.5 else 0.24, 0.05); o.data.materials.append(em)
bpy.ops.mesh.primitive_cone_add(radius1=0.55,depth=0.7,location=P(90,72,0.2),rotation=(math.radians(90),0,0)); ar=bpy.context.object; ar.data.materials.append(em)
ar.rotation_euler=(0,math.radians(-90),0); ar.rotation_euler=(math.radians(90),0,math.radians(-90))
# "you" pin
bpy.ops.mesh.primitive_cylinder_add(radius=0.1,depth=0.9,location=P(170,48,0.45)); bpy.context.object.data.materials.append(mat('pinstem',NAVY))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55,location=P(170,48,1.15)); you=bpy.context.object; you.data.materials.append(mat('you',ORANGE,.35))
for o in bpy.data.objects:
    if o.type=='MESH': 
        for p in o.data.polygons: p.use_smooth=True
# lights + world
bpy.ops.object.light_add(type='SUN',location=(-6,-8,14)); sun=bpy.context.object; sun.data.energy=2.6; sun.data.angle=math.radians(14); sun.rotation_euler=(math.radians(48),math.radians(8),math.radians(-32))
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; bg=w.node_tree.nodes['Background']; bg.inputs['Color'].default_value=(1,1,1,1); bg.inputs['Strength'].default_value=0.5
# camera (orthographic, 3/4 view)
cam_d=bpy.data.cameras.new('cam'); cam_d.type='ORTHO'; cam_d.ortho_scale=21.5
cam=bpy.data.objects.new('cam',cam_d); sc.collection.objects.link(cam); sc.camera=cam
cam.location=(-5.5,-13.5,11.5)
tgt=bpy.data.objects.new('t',None); sc.collection.objects.link(tgt); tgt.location=(0,-0.3,0.3)
tc=cam.constraints.new('TRACK_TO'); tc.target=tgt; tc.track_axis='TRACK_NEGATIVE_Z'; tc.up_axis='UP_Y'
r=sc.render; r.engine='CYCLES'; r.resolution_x=1500; r.resolution_y=980; r.film_transparent=True
r.image_settings.file_format='PNG'; r.image_settings.color_mode='RGBA'
sc.view_settings.view_transform='Standard'
cy=sc.cycles; cy.device='CPU'; cy.samples=56; cy.use_denoising=True; cy.preview_samples=8
r.filepath='/home/claude/blender/level22_raw.png'
bpy.context.view_layer.update()
# label anchors, normalised to the full frame
anch=dict(you=P(170,48,1.75),stairA=P(38,88,1.5),stairB=P(302,142,1.5),lift=P(170,131,1.3),waiting=P(286,176,0.2))
lab={}
for k,v in anch.items():
    c=world_to_camera_view(sc,cam,v); lab[k]=[round(c.x,4),round(1-c.y,4)]
json.dump(lab,open('/home/claude/blender/level22_labels_raw.json','w'))
bpy.ops.wm.save_as_mainfile(filepath='/home/claude/blender/level22.blend')
bpy.ops.render.render(write_still=True)
print('done',lab)
