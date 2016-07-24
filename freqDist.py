import re, sys, json, codecs, time, datetime, nltk
from pymongo import MongoClient 
from collections import Counter 
from nltk import word_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams

with open('config/default.json') as config_file:
	config = json.load(config_file)

conn = MongoClient(config['mongo']['host'], config['mongo']['port'])
db = getattr(conn, config['mongo']['db'])

# parse country name from parent
name = sys.argv[1]
# calculate frequency distances and persist to mongo collection
def freqDist(txt):
	
	tokenizer = nltk.RegexpTokenizer(r'[a-zA-Z0-9]{3,}')
	txt = tokenizer.tokenize(txt)
	tagged_tok = nltk.pos_tag(txt)
	
	# keep nouns (NN) and adjectives (JJ)
	filtered_tagged_tok = [w for w in tagged_tok if re.match(r'NN|JJ', w[1])]

	# calculate frequency distribution of unigrams
	fd_uno = nltk.FreqDist(filtered_tagged_tok).most_common()
	
	# calculate frequency distribution of bigrams
	bgs = nltk.bigrams(filtered_tagged_tok)
	fd_bg = nltk.FreqDist(bgs).most_common()

	if len(fd_bg) > 0 and len(fd_uno) > 0:
		update = db.countries.update_one({"name":name}, {"$set" : { "fd_bg": fd_bg, "fd_uno": fd_uno }})
		compare(fd_bg, fd_uno)

	else:
		update = db.countries.update_one({"name":name}, {"$set" : { "fd_bg": [], "fd_uno": [] }})
		print "nada"

def bg_list2tuples(list):
	for i in list:
	    i[0][0] = tuple(i[0][0])
	    i[0][1] = tuple(i[0][1]) 
	    i[0] = tuple(i[0])
	return list

def uno_list2tuples(list):
	for i in list:
		i[0] = tuple(i[0])
		i = tuple(i)
	return list


def compare(fd_bg, fd_uno, name=name):
	compare_results = []

	Q_count = db.countries.find({"name": { "$ne" : name}}).count()
	if Q_count > 0:

		Q = db.countries.find({ "name": { "$ne" : name }, "$where" : "this.fd_uno.length>0" })

		for country in Q:

			other_name = country.get('name')
			other_fd_bg = bg_list2tuples(country.get('fd_bg'))

			bg_dist = len(set(zip(*fd_bg)[0]).intersection(set(zip(*other_fd_bg)[0])))
			bg_common = set(zip(*fd_bg)[0]).intersection(set(zip(*other_fd_bg)[0]))

			link_packet = '{ "type": "link", "source": "%s", "target": "%s", "dist" : "%s"}' % (name, other_name, bg_dist)
			compare_results.append(link_packet)

	print json.dumps(compare_results)


q = db.countries.find_one({"name": name})
freqDist(q.get('h2')[0].get('p'))





