#!/usr/bin/python
import os, json, zipfile, time, datetime, hashlib

print("Content-type: text/html\n\n")

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        for file in files:
            if root == "." and (file == "icon.png" or file == "screen.png" or file == ".deletetoupdate"):
                continue
            ziph.write(os.path.join(root, file))

try:
    os.mkdir("zips")
except:
    pass

curdir = os.getcwd()
packages = {}
packages["packages"] = []

for package in os.listdir("packages"):
    if os.path.isfile("packages/" + package):
        continue

    # if the .deletetoupdate file exists, don't compress
    # also if the zip doesn't exist already
    skipRebuild = os.path.exists(curdir + "/packages/%s/.deletetoupdate" % package) and os.path.exists(curdir + "/zips/%s.zip" % package)

    if not skipRebuild:
        zipf = zipfile.ZipFile("zips/" + package + ".zip", 'w', zipfile.ZIP_DEFLATED)

    os.chdir(curdir + "/packages/" + package)

    if not skipRebuild:

        # generate a manifest to go inside of this zip
        # TODO: pull in any existing manifest and only write U entries
        # omitted files

        manifest = ""
        for root, dirs, files in os.walk("."):
            for file in files:
                if file == "manifest.install" or file == "icon.png" or file == "info.json" or file == "screen.png" or file == ".deletetoupdate":
                    continue
                manifest += "U: %s\n" % os.path.join(root, file)[2:]
        manifest_file = open("manifest.install", "w")
        manifest_file.write(manifest)
        manifest_file.close()

        print("Zipping %s...<br>" % package)
        zipdir(".", zipf)
        zipf.close()

    # Detail zip package size in KB's
    filesize = os.path.getsize(curdir + "/zips/" + package + ".zip")/1024

    # Detail extracted directory size  in KB's
    folder_size = 0
    for (root, dirs, files) in os.walk('.'):
        for file in files:
            fname = os.path.join(root, file)
            folder_size += os.path.getsize(fname)/1024

    # Date last updated (assumption is that if the app is updated the info.json would be)
    updated = time.strftime('%d/%m/%Y', time.gmtime(os.path.getmtime(curdir + "/packages/" + package + "/info.json")))

    #md5 of package zip
    filehash = hashlib.md5()
    filehash.update(open(curdir + "/zips/" + package + ".zip").read())
    mdhex = filehash.hexdigest()

    # this line isn't confusing at all (additional info makes it less so)
    packages["packages"].append({"name": package, "filesize": filesize, "updated": updated, "md5": mdhex, "extracted": folder_size})

    # if a info.json file exists, load properties from it
    if os.path.exists("info.json"):
        target = packages["packages"][-1]
        props = json.load(open("info.json", "r"))
        vals = ["title", "author", "category", "version", "description", "details", "url", "license", "changelog"]
        for val in vals:
            if val in props:
                target[val] = props[val]
            else:
                target[val] = "n/a"

    open(".deletetoupdate", 'a').close()

    os.chdir(curdir)

# do download counts for app and web for all packages
for target in ["app", "web"]:
    # open all stats from the cron job'd stats json file for this target
    statsfile = open("../../history/logs/%s/output.json" % target, "r")
    stats = json.load(statsfile)
    statsfile.close()

    for package in packages["packages"]:
        if package["name"] in stats:
            package["%s_dls" % target] = stats[package["name"]]

out = open("repo.json", "w")
json.dump(packages, out, indent=4)
out.close()

print("All Done!<br>")
