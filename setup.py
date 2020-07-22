import os
from distutils.core import setup

rootPath = os.path.dirname(os.path.realpath(__file__))
requirementPath = rootPath + '/requirements.txt'
install_requires = [] # Examples: ["gunicorn", "docutils>=0.3", "lxml==0.5a7"]
if os.path.isfile(requirementPath):
    with open(requirementPath) as f:
        install_requires = f.read().splitlines()

setup(
    name='ConceptScope',
    version=0.1,
    install_requires=install_requires,
    # packages=['ccmca'], #import as package
    # package_dir={'ccmca': 'server/ccmca'},
    # py_modules=['cca', 'cmca', 'ccmca'] # import as pure modules
)