from os import listdir
from os.path import isfile, join

dirname = 'science'
fileformat = 'png'

print(','.join(
    filename.split('.')[0] 
    for filename in listdir(dirname) 
    if isfile(join(dirname, filename)) and filename.split('.')[1] == fileformat
))

# abacus,astronomy,atom,biologist,brain,budgeting,chemical_formula,chemist,chemistry,chip,clear_code,computing,devices,DNA,DNA2,emc,erlenmeyer,footprint,geo_trends,globe,graph,hat,homework,knowledge,magnet,math,mathematics,microscope,molecule,molecules,monitor,neurology,programming,radiation,ruler,school,schoolboy,schoolgirl,scientist,teacher,test-tube,test-tube2,test-tube3,test-tube4,test-tube5,virology,world_map