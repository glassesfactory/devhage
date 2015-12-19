if ngx.req.get_method() ~= "POST" then
  ngx.exit(ngx.HTTP_NOT_ALLOWED)
end

local cjson = require "cjson"
local lfs = require "lfs"

-- list of strings to replace (the order is important to avoid conflicts)


ngx.req.read_body()
local body_data = ngx.req.get_body_data()
if body_data == nil then
  local body_data_file = ngx.req.get_body_file()
  local fh, msg = io.open(body_data_file, "r")
  if fh then
      body_data = fh:read("*a")
      fh:close()
      if body_data == nil then
          ngx.log(ngx.ERR, "no data")
          ngx.say("no data")
          return
      end
  else
    ngx.log(ngx.ERR, "no data")
    ngx.say("no data")
  end
end

local json = cjson.decode(body_data)

ngx.log(ngx.ERR, json.slug)
local slug = json.slug
if slug == nil then
  ngx.say("request no slug")
  return
end
ngx.log(ngx.ERR, "filename: "..slug)
local fn = "/var/www/devhage/data/"..slug..".json"
local file, err = io.open(fn, "w")
if file == nil then
  ngx.log(ngx.ERR, "Could not open file:" .. err)
else
  ngx.log(ngx.ERR, "file open success")
  file:write(body_data)
  file:close()
end

local lustache = require "lustache"

-- get template file.
local tmplH, err = io.open("/var/www/devhage/tmpl.html", "r")
if tmplH == nil then
  ngx.log(ngx.ERR, "Could not open tmpl...", err)
  return
end
local tmpl = tmplH:read("*a")
tmplH:close()

-- description sprit tags
if json.description ~= nil then
  -- clean html from the string
  -- json.description = string.gsub(json.description, /<!--[\s\S]*?-->/gi, "")
  json.description = string.gsub(json.description, "<%/?([%w][%w0-9]*)[^>]*>", "")

end

local result = lustache:render(tmpl, {entry = json})

if result == nil then
  ngx.log(ngx.ERR, "ooops")
  return
end

lfs.mkdir("/var/www/devhage/"..slug)

local fnOG = "/var/www/devhage/"..slug.."/index.html"
local fileOG, err = io.open(fnOG, "w")
if fileOG == nil then
  ngx.log(ngx.ERR, "Could not open file:".. err)
else
  ngx.log(ngx.ERR, "file open og success")
  fileOG:write(result)
  fileOG:close()
end


ngx.say("complete")
