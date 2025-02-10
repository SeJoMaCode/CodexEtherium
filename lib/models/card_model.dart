class CardModel {
  final String? artist;
  final String? artistIds;
  final String? asciiName;
  final String? attractionLights;
  final String? availability;
  final String? boosterTypes;
  final String? borderColor;
  final String? cardParts;
  final String? colorIdentity;
  final String? colorIndicator;
  final String? colors;
  final String? defense;
  final String? duelDeck;
  final int? edhrecRank;
  final double? edhrecSaltiness;
  final double? faceConvertedManaCost;
  final String? faceFlavorName;
  final double? faceManaValue;
  final String? faceName;
  final String? finishes;
  final String? flavorName;
  final String? flavorText;
  final String? frameEffects;
  final String? frameVersion;
  final String? hand;
  final bool? hasAlternativeDeckLimit;
  final bool? hasContentWarning;
  final bool? hasFoil;
  final bool? hasNonFoil;
  final bool? isAlternative;
  final bool? isFullArt;
  final bool? isFunny;
  final bool? isOnlineOnly;
  final bool? isOversized;
  final bool? isPromo;
  final bool? isRebalanced;
  final bool? isReprint;
  final bool? isReserved;
  final bool? isStarter;
  final bool? isStorySpotlight;
  final bool? isTextless;
  final bool? isTimeshifted;
  final String? keywords;
  final String? language;
  final String? layout;
  final String? leadershipSkills;
  final String? life;
  final String? loyalty;
  final String? manaCost;
  final double? manaValue;
  final String? name;
  final String? number;
  final String? originalPrintings;
  final String? originalReleaseDate;
  final String? originalText;
  final String? originalType;
  final String? otherFaceIds;
  final String? power;
  final String? printings;
  final String? promoTypes;
  final String? rarity;
  final String? rebalancedPrintings;
  final String? relatedCards;
  final String? securityStamp;
  final String? setCode;
  final String? side;
  final String? signature;
  final String? sourceProducts;
  final String? subsets;
  final String? subtypes;
  final String? supertypes;
  final String? text;
  final String? toughness;
  final String? type;
  final String? types;
  final String uuid;
  final String? variations;
  final String? watermark;

  CardModel({
    this.artist,
    this.artistIds,
    this.asciiName,
    this.attractionLights,
    this.availability,
    this.boosterTypes,
    this.borderColor,
    this.cardParts,
    this.colorIdentity,
    this.colorIndicator,
    this.colors,
    this.defense,
    this.duelDeck,
    this.edhrecRank,
    this.edhrecSaltiness,
    this.faceConvertedManaCost,
    this.faceFlavorName,
    this.faceManaValue,
    this.faceName,
    this.finishes,
    this.flavorName,
    this.flavorText,
    this.frameEffects,
    this.frameVersion,
    this.hand,
    this.hasAlternativeDeckLimit,
    this.hasContentWarning,
    this.hasFoil,
    this.hasNonFoil,
    this.isAlternative,
    this.isFullArt,
    this.isFunny,
    this.isOnlineOnly,
    this.isOversized,
    this.isPromo,
    this.isRebalanced,
    this.isReprint,
    this.isReserved,
    this.isStarter,
    this.isStorySpotlight,
    this.isTextless,
    this.isTimeshifted,
    this.keywords,
    this.language,
    this.layout,
    this.leadershipSkills,
    this.life,
    this.loyalty,
    this.manaCost,
    this.manaValue,
    this.name,
    this.number,
    this.originalPrintings,
    this.originalReleaseDate,
    this.originalText,
    this.originalType,
    this.otherFaceIds,
    this.power,
    this.printings,
    this.promoTypes,
    this.rarity,
    this.rebalancedPrintings,
    this.relatedCards,
    this.securityStamp,
    this.setCode,
    this.side,
    this.signature,
    this.sourceProducts,
    this.subsets,
    this.subtypes,
    this.supertypes,
    this.text,
    this.toughness,
    this.type,
    this.types,
    required this.uuid,
    this.variations,
    this.watermark,
  });

  static bool? _toBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return null;
  }

  factory CardModel.fromMap(Map<String, dynamic> map) {
    return CardModel(
      artist: map['artist'] as String?,
      artistIds: map['artistIds'] as String?,
      asciiName: map['asciiName'] as String?,
      attractionLights: map['attractionLights'] as String?,
      availability: map['availability'] as String?,
      boosterTypes: map['boosterTypes'] as String?,
      borderColor: map['borderColor'] as String?,
      cardParts: map['cardParts'] as String?,
      colorIdentity: map['colorIdentity'] as String?,
      colorIndicator: map['colorIndicator'] as String?,
      colors: map['colors'] as String?,
      defense: map['defense'] as String?,
      duelDeck: map['duelDeck'] as String?,
      edhrecRank: map['edhrecRank'] as int?,
      edhrecSaltiness: map['edhrecSaltiness'] is num ? (map['edhrecSaltiness'] as num).toDouble() : null,
      faceConvertedManaCost: map['faceConvertedManaCost'] is num ? (map['faceConvertedManaCost'] as num).toDouble() : null,
      faceFlavorName: map['faceFlavorName'] as String?,
      faceManaValue: map['faceManaValue'] is num ? (map['faceManaValue'] as num).toDouble() : null,
      faceName: map['faceName'] as String?,
      finishes: map['finishes'] as String?,
      flavorName: map['flavorName'] as String?,
      flavorText: map['flavorText'] as String?,
      frameEffects: map['frameEffects'] as String?,
      frameVersion: map['frameVersion'] as String?,
      hand: map['hand'] as String?,
      hasAlternativeDeckLimit: _toBool(map['hasAlternativeDeckLimit']),
      hasContentWarning: _toBool(map['hasContentWarning']),
      hasFoil: _toBool(map['hasFoil']),
      hasNonFoil: _toBool(map['hasNonFoil']),
      isAlternative: _toBool(map['isAlternative']),
      isFullArt: _toBool(map['isFullArt']),
      isFunny: _toBool(map['isFunny']),
      isOnlineOnly: _toBool(map['isOnlineOnly']),
      isOversized: _toBool(map['isOversized']),
      isPromo: _toBool(map['isPromo']),
      isRebalanced: _toBool(map['isRebalanced']),
      isReprint: _toBool(map['isReprint']),
      isReserved: _toBool(map['isReserved']),
      isStarter: _toBool(map['isStarter']),
      isStorySpotlight: _toBool(map['isStorySpotlight']),
      isTextless: _toBool(map['isTextless']),
      isTimeshifted: _toBool(map['isTimeshifted']),
      keywords: map['keywords'] as String?,
      language: map['language'] as String?,
      layout: map['layout'] as String?,
      leadershipSkills: map['leadershipSkills'] as String?,
      life: map['life'] as String?,
      loyalty: map['loyalty'] as String?,
      manaCost: map['manaCost'] as String?,
      manaValue: map['manaValue'] is num ? (map['manaValue'] as num).toDouble() : null,
      name: map['name'] as String?,
      number: map['number'] as String?,
      originalPrintings: map['originalPrintings'] as String?,
      originalReleaseDate: map['originalReleaseDate'] as String?,
      originalText: map['originalText'] as String?,
      originalType: map['originalType'] as String?,
      otherFaceIds: map['otherFaceIds'] as String?,
      power: map['power'] as String?,
      printings: map['printings'] as String?,
      promoTypes: map['promoTypes'] as String?,
      rarity: map['rarity'] as String?,
      rebalancedPrintings: map['rebalancedPrintings'] as String?,
      relatedCards: map['relatedCards'] as String?,
      securityStamp: map['securityStamp'] as String?,
      setCode: map['setCode'] as String?,
      side: map['side'] as String?,
      signature: map['signature'] as String?,
      sourceProducts: map['sourceProducts'] as String?,
      subsets: map['subsets'] as String?,
      subtypes: map['subtypes'] as String?,
      supertypes: map['supertypes'] as String?,
      text: map['text'] as String?,
      toughness: map['toughness'] as String?,
      type: map['type'] as String?,
      types: map['types'] as String?,
      uuid: map['uuid'] as String,
      variations: map['variations'] as String?,
      watermark: map['watermark'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'artist': artist,
      'artistIds': artistIds,
      'asciiName': asciiName,
      'attractionLights': attractionLights,
      'availability': availability,
      'boosterTypes': boosterTypes,
      'borderColor': borderColor,
      'cardParts': cardParts,
      'colorIdentity': colorIdentity,
      'colorIndicator': colorIndicator,
      'colors': colors,
      'defense': defense,
      'duelDeck': duelDeck,
      'edhrecRank': edhrecRank,
      'edhrecSaltiness': edhrecSaltiness,
      'faceConvertedManaCost': faceConvertedManaCost,
      'faceFlavorName': faceFlavorName,
      'faceManaValue': faceManaValue,
      'faceName': faceName,
      'finishes': finishes,
      'flavorName': flavorName,
      'flavorText': flavorText,
      'frameEffects': frameEffects,
      'frameVersion': frameVersion,
      'hand': hand,
      'hasAlternativeDeckLimit': hasAlternativeDeckLimit,
      'hasContentWarning': hasContentWarning,
      'hasFoil': hasFoil,
      'hasNonFoil': hasNonFoil,
      'isAlternative': isAlternative,
      'isFullArt': isFullArt,
      'isFunny': isFunny,
      'isOnlineOnly': isOnlineOnly,
      'isOversized': isOversized,
      'isPromo': isPromo,
      'isRebalanced': isRebalanced,
      'isReprint': isReprint,
      'isReserved': isReserved,
      'isStarter': isStarter,
      'isStorySpotlight': isStorySpotlight,
      'isTextless': isTextless,
      'isTimeshifted': isTimeshifted,
      'keywords': keywords,
      'language': language,
      'layout': layout,
      'leadershipSkills': leadershipSkills,
      'life': life,
      'loyalty': loyalty,
      'manaCost': manaCost,
      'manaValue': manaValue,
      'name': name,
      'number': number,
      'originalPrintings': originalPrintings,
      'originalReleaseDate': originalReleaseDate,
      'originalText': originalText,
      'originalType': originalType,
      'otherFaceIds': otherFaceIds,
      'power': power,
      'printings': printings,
      'promoTypes': promoTypes,
      'rarity': rarity,
      'rebalancedPrintings': rebalancedPrintings,
      'relatedCards': relatedCards,
      'securityStamp': securityStamp,
      'setCode': setCode,
      'side': side,
      'signature': signature,
      'sourceProducts': sourceProducts,
      'subsets': subsets,
      'subtypes': subtypes,
      'supertypes': supertypes,
      'text': text,
      'toughness': toughness,
      'type': type,
      'types': types,
      'uuid': uuid,
      'variations': variations,
      'watermark': watermark,
    };
  }
}