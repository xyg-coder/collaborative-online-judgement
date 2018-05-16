import docker
import uuid
import os
import shutil

from docker.errors import *

client = docker.from_env()

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
IMAGE_NAME = "xinyuangui/coj_demo1"
TEMP_BUILD_DIR = "%s/temp/" % CURRENT_DIR

SOURCE_FILE_NAMES = {
    "java": "Example.java",
    "c++": "example.cpp",
    'python': 'example.py'
}

BINARY_NAMES = {
    "java": "Example",
    "c++": "",
    'python': 'example.py'
}

BUILD_COMMANDS = {
    "java": "javac",
    "c++": "g++",
    "python": "python"
}

EXECUTE_COMMANDS = {
    "java": "java",
    "c++": "./a.out",
    "python": "python"
}


def load_image():
    try:
        client.images.get(IMAGE_NAME)
    except ImageNotFound:
        print "image not found locally. Loading it from the Dockerhub..."
        client.images.pull(IMAGE_NAME)
    except APIError:
        print "Image not found locally. Dockerhub is not accessible."
        return
    print "image:[%s] loaded" % IMAGE_NAME


def build_and_run(code, lang):
    # Docker operations
    result = {'build': None, 'run': None, 'error': None}
    source_file_parent_dir_name = uuid.uuid4()
    source_file_host_dir = "%s/%s" % (TEMP_BUILD_DIR, source_file_parent_dir_name)
    source_file_guest_dir = "/test/%s" % source_file_parent_dir_name
    make_dir(source_file_host_dir)

    with open('%s/%s' % (source_file_host_dir, SOURCE_FILE_NAMES[lang]), 'w') as source_file:
        source_file.write(code)

    try:
        client.containers.run(
            image=IMAGE_NAME,
            command="%s %s" % (BUILD_COMMANDS[lang], SOURCE_FILE_NAMES[lang]),
            volumes={source_file_host_dir: {'bind': source_file_guest_dir, 'mode': 'rw'}},
            working_dir=source_file_guest_dir
        );
        print "Source built."
        result['build'] = 'Ok'
    except ContainerError as e:
        print "Build failed"
        result['build'] = e.stderr
        shutil.rmtree(source_file_host_dir)
        return result

    try:
        log = client.containers.run(
            image=IMAGE_NAME,
            command="%s %s" % (EXECUTE_COMMANDS[lang], BINARY_NAMES[lang]),
            volumes={source_file_host_dir: {'bind': source_file_guest_dir, 'mode': 'rw'}},
            working_dir=source_file_guest_dir)
        print "Executed."
        result['run'] = log
    except ContainerError as e:
        print "Execution failed."
        result['run'] = e.stderr
        shutil.rmtree(source_file_host_dir)
        return result

    shutil.rmtree(source_file_host_dir)
    return result


def make_dir(dir):
    try:
        os.mkdir(dir)
        print "temp build directory [%s] created." % dir
    except OSError:
        print "temp build directory [%s] exists" % dir
