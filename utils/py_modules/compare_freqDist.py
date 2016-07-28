import os, sys, json
from pymongo import MongoClient 

if 'py_env' in os.environ:
	configFile = os.environ['py_env']
else:
	configFile = 'default'

with open('./config/' + configFile + '.json') as config_file:
	config = json.load(config_file)

conn = MongoClient(config['mongo']['host'], config['mongo']['port'])
db = getattr(conn, config['mongo']['db'])

# parse country and otherCountry names from parent
country = sys.argv[1]
otherCountry = sys.argv[2]

def bg_list2tuples(l):
	for i in l:
	    i[0][0] = tuple(i[0][0])
	    i[0][1] = tuple(i[0][1]) 
	    i[0] = tuple(i[0])
	return l

'''
def uno_list2tuples(l):
	for i in l:
		i[0] = tuple(i[0])
		i = tuple(i)
	return l
'''

def compare(country, otherCountry):

	q_country = db.countries.find_one({"name": country})
	q_otherCountry = db.countries.find_one({"name": otherCountry})

	fd_bg = bg_list2tuples(q_country.get('fd_bg'))
	other_fd_bg = bg_list2tuples(q_otherCountry.get('fd_bg'))

	# TODO show bubble up interstiong of bigrams to front end
	bg_common = set(zip(*fd_bg)[0]).intersection(set(zip(*other_fd_bg)[0]))
	bg_dist = len(bg_common)
	
	db.countries.update_one({"name": country}, {"$push" : { "edges" : { "country": otherCountry, "dist": bg_dist }}})
	db.countries.update_one({"name": otherCountry}, {"$push" : { "edges" : { "country": country, "dist": bg_dist }}})

	#ret = '{ "type": "link", "source": "%s", "target": "%s", "dist" : "%s"}' % (country, otherCountry, bg_dist)
	#print json.dumps(ret)
	#print bg_common
	print bg_dist

compare(country, otherCountry)





