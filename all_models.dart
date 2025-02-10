class AndroidMetadataModel {
  final String? locale;

  AndroidMetadataModel({
    this.locale,
  });

  factory AndroidMetadataModel.fromMap(Map<String, dynamic> map) {
    return AndroidMetadataModel(
      locale: map['locale'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'locale': locale,
    };
  }
}
class CardForeignDataModel {
  final String? faceName;
  final String? flavorText;
  final String? identifiers;
  final String? language;
  final int? multiverseId;
  final String? name;
  final String? text;
  final String? type;
  final String? uuid;

  CardForeignDataModel({
    this.faceName,
    this.flavorText,
    this.identifiers,
    this.language,
    this.multiverseId,
    this.name,
    this.text,
    this.type,
    this.uuid,
  });

  factory CardForeignDataModel.fromMap(Map<String, dynamic> map) {
    return CardForeignDataModel(
      faceName: map['faceName'] as String?,
      flavorText: map['flavorText'] as String?,
      identifiers: map['identifiers'] as String?,
      language: map['language'] as String?,
      multiverseId: map['multiverseId'] as int?,
      name: map['name'] as String?,
      text: map['text'] as String?,
      type: map['type'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'faceName': faceName,
      'flavorText': flavorText,
      'identifiers': identifiers,
      'language': language,
      'multiverseId': multiverseId,
      'name': name,
      'text': text,
      'type': type,
      'uuid': uuid,
    };
  }
}
class CardIdentifiersModel {
  final String? cardKingdomEtchedId;
  final String? cardKingdomFoilId;
  final String? cardKingdomId;
  final String? cardsphereFoilId;
  final String? cardsphereId;
  final String? deckboxId;
  final String? mcmId;
  final String? mcmMetaId;
  final String? mtgArenaId;
  final String? mtgjsonFoilVersionId;
  final String? mtgjsonNonFoilVersionId;
  final String? mtgjsonV4Id;
  final String? mtgoFoilId;
  final String? mtgoId;
  final String? multiverseId;
  final String? scryfallCardBackId;
  final String? scryfallId;
  final String? scryfallIllustrationId;
  final String? scryfallOracleId;
  final String? tcgplayerEtchedProductId;
  final String? tcgplayerProductId;
  final String? uuid;

  CardIdentifiersModel({
    this.cardKingdomEtchedId,
    this.cardKingdomFoilId,
    this.cardKingdomId,
    this.cardsphereFoilId,
    this.cardsphereId,
    this.deckboxId,
    this.mcmId,
    this.mcmMetaId,
    this.mtgArenaId,
    this.mtgjsonFoilVersionId,
    this.mtgjsonNonFoilVersionId,
    this.mtgjsonV4Id,
    this.mtgoFoilId,
    this.mtgoId,
    this.multiverseId,
    this.scryfallCardBackId,
    this.scryfallId,
    this.scryfallIllustrationId,
    this.scryfallOracleId,
    this.tcgplayerEtchedProductId,
    this.tcgplayerProductId,
    this.uuid,
  });

  factory CardIdentifiersModel.fromMap(Map<String, dynamic> map) {
    return CardIdentifiersModel(
      cardKingdomEtchedId: map['cardKingdomEtchedId'] as String?,
      cardKingdomFoilId: map['cardKingdomFoilId'] as String?,
      cardKingdomId: map['cardKingdomId'] as String?,
      cardsphereFoilId: map['cardsphereFoilId'] as String?,
      cardsphereId: map['cardsphereId'] as String?,
      deckboxId: map['deckboxId'] as String?,
      mcmId: map['mcmId'] as String?,
      mcmMetaId: map['mcmMetaId'] as String?,
      mtgArenaId: map['mtgArenaId'] as String?,
      mtgjsonFoilVersionId: map['mtgjsonFoilVersionId'] as String?,
      mtgjsonNonFoilVersionId: map['mtgjsonNonFoilVersionId'] as String?,
      mtgjsonV4Id: map['mtgjsonV4Id'] as String?,
      mtgoFoilId: map['mtgoFoilId'] as String?,
      mtgoId: map['mtgoId'] as String?,
      multiverseId: map['multiverseId'] as String?,
      scryfallCardBackId: map['scryfallCardBackId'] as String?,
      scryfallId: map['scryfallId'] as String?,
      scryfallIllustrationId: map['scryfallIllustrationId'] as String?,
      scryfallOracleId: map['scryfallOracleId'] as String?,
      tcgplayerEtchedProductId: map['tcgplayerEtchedProductId'] as String?,
      tcgplayerProductId: map['tcgplayerProductId'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'cardKingdomEtchedId': cardKingdomEtchedId,
      'cardKingdomFoilId': cardKingdomFoilId,
      'cardKingdomId': cardKingdomId,
      'cardsphereFoilId': cardsphereFoilId,
      'cardsphereId': cardsphereId,
      'deckboxId': deckboxId,
      'mcmId': mcmId,
      'mcmMetaId': mcmMetaId,
      'mtgArenaId': mtgArenaId,
      'mtgjsonFoilVersionId': mtgjsonFoilVersionId,
      'mtgjsonNonFoilVersionId': mtgjsonNonFoilVersionId,
      'mtgjsonV4Id': mtgjsonV4Id,
      'mtgoFoilId': mtgoFoilId,
      'mtgoId': mtgoId,
      'multiverseId': multiverseId,
      'scryfallCardBackId': scryfallCardBackId,
      'scryfallId': scryfallId,
      'scryfallIllustrationId': scryfallIllustrationId,
      'scryfallOracleId': scryfallOracleId,
      'tcgplayerEtchedProductId': tcgplayerEtchedProductId,
      'tcgplayerProductId': tcgplayerProductId,
      'uuid': uuid,
    };
  }
}
class CardLegalitiesModel {
  final String? alchemy;
  final String? brawl;
  final String? commander;
  final String? duel;
  final String? explorer;
  final String? future;
  final String? gladiator;
  final String? historic;
  final String? legacy;
  final String? modern;
  final String? oathbreaker;
  final String? oldschool;
  final String? pauper;
  final String? paupercommander;
  final String? penny;
  final String? pioneer;
  final String? predh;
  final String? premodern;
  final String? standard;
  final String? standardbrawl;
  final String? timeless;
  final String? uuid;
  final String? vintage;

  CardLegalitiesModel({
    this.alchemy,
    this.brawl,
    this.commander,
    this.duel,
    this.explorer,
    this.future,
    this.gladiator,
    this.historic,
    this.legacy,
    this.modern,
    this.oathbreaker,
    this.oldschool,
    this.pauper,
    this.paupercommander,
    this.penny,
    this.pioneer,
    this.predh,
    this.premodern,
    this.standard,
    this.standardbrawl,
    this.timeless,
    this.uuid,
    this.vintage,
  });

  factory CardLegalitiesModel.fromMap(Map<String, dynamic> map) {
    return CardLegalitiesModel(
      alchemy: map['alchemy'] as String?,
      brawl: map['brawl'] as String?,
      commander: map['commander'] as String?,
      duel: map['duel'] as String?,
      explorer: map['explorer'] as String?,
      future: map['future'] as String?,
      gladiator: map['gladiator'] as String?,
      historic: map['historic'] as String?,
      legacy: map['legacy'] as String?,
      modern: map['modern'] as String?,
      oathbreaker: map['oathbreaker'] as String?,
      oldschool: map['oldschool'] as String?,
      pauper: map['pauper'] as String?,
      paupercommander: map['paupercommander'] as String?,
      penny: map['penny'] as String?,
      pioneer: map['pioneer'] as String?,
      predh: map['predh'] as String?,
      premodern: map['premodern'] as String?,
      standard: map['standard'] as String?,
      standardbrawl: map['standardbrawl'] as String?,
      timeless: map['timeless'] as String?,
      uuid: map['uuid'] as String?,
      vintage: map['vintage'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'alchemy': alchemy,
      'brawl': brawl,
      'commander': commander,
      'duel': duel,
      'explorer': explorer,
      'future': future,
      'gladiator': gladiator,
      'historic': historic,
      'legacy': legacy,
      'modern': modern,
      'oathbreaker': oathbreaker,
      'oldschool': oldschool,
      'pauper': pauper,
      'paupercommander': paupercommander,
      'penny': penny,
      'pioneer': pioneer,
      'predh': predh,
      'premodern': premodern,
      'standard': standard,
      'standardbrawl': standardbrawl,
      'timeless': timeless,
      'uuid': uuid,
      'vintage': vintage,
    };
  }
}
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
class CardPurchaseUrlsModel {
  final String? cardKingdom;
  final String? cardKingdomEtched;
  final String? cardKingdomFoil;
  final String? cardmarket;
  final String? tcgplayer;
  final String? tcgplayerEtched;
  final String? uuid;

  CardPurchaseUrlsModel({
    this.cardKingdom,
    this.cardKingdomEtched,
    this.cardKingdomFoil,
    this.cardmarket,
    this.tcgplayer,
    this.tcgplayerEtched,
    this.uuid,
  });

  factory CardPurchaseUrlsModel.fromMap(Map<String, dynamic> map) {
    return CardPurchaseUrlsModel(
      cardKingdom: map['cardKingdom'] as String?,
      cardKingdomEtched: map['cardKingdomEtched'] as String?,
      cardKingdomFoil: map['cardKingdomFoil'] as String?,
      cardmarket: map['cardmarket'] as String?,
      tcgplayer: map['tcgplayer'] as String?,
      tcgplayerEtched: map['tcgplayerEtched'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'cardKingdom': cardKingdom,
      'cardKingdomEtched': cardKingdomEtched,
      'cardKingdomFoil': cardKingdomFoil,
      'cardmarket': cardmarket,
      'tcgplayer': tcgplayer,
      'tcgplayerEtched': tcgplayerEtched,
      'uuid': uuid,
    };
  }
}
class CardRulingsModel {
  final DateTime? date;
  final String? text;
  final String uuid;

  CardRulingsModel({
    this.date,
    this.text,
    required this.uuid,
  });

  factory CardRulingsModel.fromMap(Map<String, dynamic> map) {
    DateTime? rulingDate;
    if (map['date'] != null) {
      rulingDate = DateTime.tryParse(map['date'] as String);
    }
    return CardRulingsModel(
      date: rulingDate,
      text: map['text'] as String?,
      uuid: map['uuid'] as String,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'date': date?.toIso8601String(),
      'text': text,
      'uuid': uuid,
    };
  }
}
class MetaModel {
  final DateTime? date;
  final String? version;

  MetaModel({
    this.date,
    this.version,
  });

  factory MetaModel.fromMap(Map<String, dynamic> map) {
    DateTime? parsedDate;
    if (map['date'] != null) {
      parsedDate = DateTime.tryParse(map['date'] as String);
    }
    return MetaModel(
      date: parsedDate,
      version: map['version'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'date': date?.toIso8601String(),
      'version': version,
    };
  }
}
class SetBoosterContentsModel {
  final int? boosterIndex;
  final String? boosterName;
  final String? setCode;
  final String? sheetName;
  final int? sheetPicks;

  SetBoosterContentsModel({
    this.boosterIndex,
    this.boosterName,
    this.setCode,
    this.sheetName,
    this.sheetPicks,
  });

  factory SetBoosterContentsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterContentsModel(
      boosterIndex: map['boosterIndex'] as int?,
      boosterName: map['boosterName'] as String?,
      setCode: map['setCode'] as String?,
      sheetName: map['sheetName'] as String?,
      sheetPicks: map['sheetPicks'] as int?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterIndex': boosterIndex,
      'boosterName': boosterName,
      'setCode': setCode,
      'sheetName': sheetName,
      'sheetPicks': sheetPicks,
    };
  }
}
class SetBoosterContentWeightsModel {
  final int? boosterIndex;
  final String? boosterName;
  final int? boosterWeight;
  final String? setCode;

  SetBoosterContentWeightsModel({
    this.boosterIndex,
    this.boosterName,
    this.boosterWeight,
    this.setCode,
  });

  factory SetBoosterContentWeightsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterContentWeightsModel(
      boosterIndex: map['boosterIndex'] as int?,
      boosterName: map['boosterName'] as String?,
      boosterWeight: map['boosterWeight'] as int?,
      setCode: map['setCode'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterIndex': boosterIndex,
      'boosterName': boosterName,
      'boosterWeight': boosterWeight,
      'setCode': setCode,
    };
  }
}
class SetBoosterSheetsModel {
  final String? boosterName;
  final String? setCode;
  final bool? sheetHasBalanceColors;
  final bool? sheetIsFoil;
  final String? sheetName;

  SetBoosterSheetsModel({
    this.boosterName,
    this.setCode,
    this.sheetHasBalanceColors,
    this.sheetIsFoil,
    this.sheetName,
  });

  static bool? _toBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return null;
  }

  factory SetBoosterSheetsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterSheetsModel(
      boosterName: map['boosterName'] as String?,
      setCode: map['setCode'] as String?,
      sheetHasBalanceColors: _toBool(map['sheetHasBalanceColors']),
      sheetIsFoil: _toBool(map['sheetIsFoil']),
      sheetName: map['sheetName'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterName': boosterName,
      'setCode': setCode,
      'sheetHasBalanceColors': sheetHasBalanceColors,
      'sheetIsFoil': sheetIsFoil,
      'sheetName': sheetName,
    };
  }
}
class SetBoosterSheetCardsModel {
  final String? boosterName;
  final String cardUuid; // required
  final int? cardWeight;
  final String? setCode;
  final String? sheetName;

  SetBoosterSheetCardsModel({
    this.boosterName,
    required this.cardUuid,
    this.cardWeight,
    this.setCode,
    this.sheetName,
  });

  factory SetBoosterSheetCardsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterSheetCardsModel(
      boosterName: map['boosterName'] as String?,
      cardUuid: map['cardUuid'] as String,
      cardWeight: map['cardWeight'] as int?,
      setCode: map['setCode'] as String?,
      sheetName: map['sheetName'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterName': boosterName,
      'cardUuid': cardUuid,
      'cardWeight': cardWeight,
      'setCode': setCode,
      'sheetName': sheetName,
    };
  }
}
class SetModel {
  final int? baseSetSize;
  final String? block;
  final int? cardsphereSetId;
  final String code;
  final bool? isFoilOnly;
  final bool? isForeignOnly;
  final bool? isNonFoilOnly;
  final bool? isOnlineOnly;
  final bool? isPartialPreview;
  final String? keyruneCode;
  final String? languages;
  final int? mcmId;
  final int? mcmIdExtras;
  final String? mcmName;
  final String? mtgoCode;
  final String? name;
  final String? parentCode;
  final String? releaseDate;
  final int? tcgplayerGroupId;
  final String? tokenSetCode;
  final int? totalSetSize;
  final String? type;

  SetModel({
    this.baseSetSize,
    this.block,
    this.cardsphereSetId,
    required this.code,
    this.isFoilOnly,
    this.isForeignOnly,
    this.isNonFoilOnly,
    this.isOnlineOnly,
    this.isPartialPreview,
    this.keyruneCode,
    this.languages,
    this.mcmId,
    this.mcmIdExtras,
    this.mcmName,
    this.mtgoCode,
    this.name,
    this.parentCode,
    this.releaseDate,
    this.tcgplayerGroupId,
    this.tokenSetCode,
    this.totalSetSize,
    this.type,
  });

  static bool? _toBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return null;
  }

  factory SetModel.fromMap(Map<String, dynamic> map) {
    return SetModel(
      baseSetSize: map['baseSetSize'] as int?,
      block: map['block'] as String?,
      cardsphereSetId: map['cardsphereSetId'] as int?,
      code: map['code'] as String,
      isFoilOnly: _toBool(map['isFoilOnly']),
      isForeignOnly: _toBool(map['isForeignOnly']),
      isNonFoilOnly: _toBool(map['isNonFoilOnly']),
      isOnlineOnly: _toBool(map['isOnlineOnly']),
      isPartialPreview: _toBool(map['isPartialPreview']),
      keyruneCode: map['keyruneCode'] as String?,
      languages: map['languages'] as String?,
      mcmId: map['mcmId'] as int?,
      mcmIdExtras: map['mcmIdExtras'] as int?,
      mcmName: map['mcmName'] as String?,
      mtgoCode: map['mtgoCode'] as String?,
      name: map['name'] as String?,
      parentCode: map['parentCode'] as String?,
      releaseDate: map['releaseDate'] as String?,
      tcgplayerGroupId: map['tcgplayerGroupId'] as int?,
      tokenSetCode: map['tokenSetCode'] as String?,
      totalSetSize: map['totalSetSize'] as int?,
      type: map['type'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'baseSetSize': baseSetSize,
      'block': block,
      'cardsphereSetId': cardsphereSetId,
      'code': code,
      'isFoilOnly': isFoilOnly,
      'isForeignOnly': isForeignOnly,
      'isNonFoilOnly': isNonFoilOnly,
      'isOnlineOnly': isOnlineOnly,
      'isPartialPreview': isPartialPreview,
      'keyruneCode': keyruneCode,
      'languages': languages,
      'mcmId': mcmId,
      'mcmIdExtras': mcmIdExtras,
      'mcmName': mcmName,
      'mtgoCode': mtgoCode,
      'name': name,
      'parentCode': parentCode,
      'releaseDate': releaseDate,
      'tcgplayerGroupId': tcgplayerGroupId,
      'tokenSetCode': tokenSetCode,
      'totalSetSize': totalSetSize,
      'type': type,
    };
  }
}
class SetTranslationsModel {
  final String? language;
  final String? setCode;
  final String? translation;

  SetTranslationsModel({
    this.language,
    this.setCode,
    this.translation,
  });

  factory SetTranslationsModel.fromMap(Map<String, dynamic> map) {
    return SetTranslationsModel(
      language: map['language'] as String?,
      setCode: map['setCode'] as String?,
      translation: map['translation'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'language': language,
      'setCode': setCode,
      'translation': translation,
    };
  }
}
class TokenIdentifiersModel {
  final String? cardKingdomEtchedId;
  final String? cardKingdomFoilId;
  final String? cardKingdomId;
  final String? cardsphereFoilId;
  final String? cardsphereId;
  final String? deckboxId;
  final String? mcmId;
  final String? mcmMetaId;
  final String? mtgArenaId;
  final String? mtgjsonFoilVersionId;
  final String? mtgjsonNonFoilVersionId;
  final String? mtgjsonV4Id;
  final String? mtgoFoilId;
  final String? mtgoId;
  final String? multiverseId;
  final String? scryfallCardBackId;
  final String? scryfallId;
  final String? scryfallIllustrationId;
  final String? scryfallOracleId;
  final String? tcgplayerEtchedProductId;
  final String? tcgplayerProductId;
  final String? uuid;

  TokenIdentifiersModel({
    this.cardKingdomEtchedId,
    this.cardKingdomFoilId,
    this.cardKingdomId,
    this.cardsphereFoilId,
    this.cardsphereId,
    this.deckboxId,
    this.mcmId,
    this.mcmMetaId,
    this.mtgArenaId,
    this.mtgjsonFoilVersionId,
    this.mtgjsonNonFoilVersionId,
    this.mtgjsonV4Id,
    this.mtgoFoilId,
    this.mtgoId,
    this.multiverseId,
    this.scryfallCardBackId,
    this.scryfallId,
    this.scryfallIllustrationId,
    this.scryfallOracleId,
    this.tcgplayerEtchedProductId,
    this.tcgplayerProductId,
    this.uuid,
  });

  factory TokenIdentifiersModel.fromMap(Map<String, dynamic> map) {
    return TokenIdentifiersModel(
      cardKingdomEtchedId: map['cardKingdomEtchedId'] as String?,
      cardKingdomFoilId: map['cardKingdomFoilId'] as String?,
      cardKingdomId: map['cardKingdomId'] as String?,
      cardsphereFoilId: map['cardsphereFoilId'] as String?,
      cardsphereId: map['cardsphereId'] as String?,
      deckboxId: map['deckboxId'] as String?,
      mcmId: map['mcmId'] as String?,
      mcmMetaId: map['mcmMetaId'] as String?,
      mtgArenaId: map['mtgArenaId'] as String?,
      mtgjsonFoilVersionId: map['mtgjsonFoilVersionId'] as String?,
      mtgjsonNonFoilVersionId: map['mtgjsonNonFoilVersionId'] as String?,
      mtgjsonV4Id: map['mtgjsonV4Id'] as String?,
      mtgoFoilId: map['mtgoFoilId'] as String?,
      mtgoId: map['mtgoId'] as String?,
      multiverseId: map['multiverseId'] as String?,
      scryfallCardBackId: map['scryfallCardBackId'] as String?,
      scryfallId: map['scryfallId'] as String?,
      scryfallIllustrationId: map['scryfallIllustrationId'] as String?,
      scryfallOracleId: map['scryfallOracleId'] as String?,
      tcgplayerEtchedProductId: map['tcgplayerEtchedProductId'] as String?,
      tcgplayerProductId: map['tcgplayerProductId'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'cardKingdomEtchedId': cardKingdomEtchedId,
      'cardKingdomFoilId': cardKingdomFoilId,
      'cardKingdomId': cardKingdomId,
      'cardsphereFoilId': cardsphereFoilId,
      'cardsphereId': cardsphereId,
      'deckboxId': deckboxId,
      'mcmId': mcmId,
      'mcmMetaId': mcmMetaId,
      'mtgArenaId': mtgArenaId,
      'mtgjsonFoilVersionId': mtgjsonFoilVersionId,
      'mtgjsonNonFoilVersionId': mtgjsonNonFoilVersionId,
      'mtgjsonV4Id': mtgjsonV4Id,
      'mtgoFoilId': mtgoFoilId,
      'mtgoId': mtgoId,
      'multiverseId': multiverseId,
      'scryfallCardBackId': scryfallCardBackId,
      'scryfallId': scryfallId,
      'scryfallIllustrationId': scryfallIllustrationId,
      'scryfallOracleId': scryfallOracleId,
      'tcgplayerEtchedProductId': tcgplayerEtchedProductId,
      'tcgplayerProductId': tcgplayerProductId,
      'uuid': uuid,
    };
  }
}
class TokenModel {
  final String? artist;
  final String? artistIds;
  final String? asciiName;
  final String? availability;
  final String? boosterTypes;
  final String? borderColor;
  final String? colorIdentity;
  final String? colors;
  final double? edhrecSaltiness;
  final String? faceName;
  final String? finishes;
  final String? flavorName;
  final String? flavorText;
  final String? frameEffects;
  final String? frameVersion;
  final bool? hasFoil;
  final bool? hasNonFoil;
  final bool? isFullArt;
  final bool? isFunny;
  final bool? isOversized;
  final bool? isPromo;
  final bool? isReprint;
  final bool? isTextless;
  final String? keywords;
  final String? language;
  final String? layout;
  final String? manaCost;
  final String? name;
  final String? number;
  final String? orientation;
  final String? originalText;
  final String? originalType;
  final String? otherFaceIds;
  final String? power;
  final String? promoTypes;
  final String? relatedCards;
  final String? reverseRelated;
  final String? securityStamp;
  final String? setCode;
  final String? side;
  final String? signature;
  final String? subtypes;
  final String? supertypes;
  final String? text;
  final String? toughness;
  final String? type;
  final String? types;
  final String uuid;
  final String? watermark;

  TokenModel({
    this.artist,
    this.artistIds,
    this.asciiName,
    this.availability,
    this.boosterTypes,
    this.borderColor,
    this.colorIdentity,
    this.colors,
    this.edhrecSaltiness,
    this.faceName,
    this.finishes,
    this.flavorName,
    this.flavorText,
    this.frameEffects,
    this.frameVersion,
    this.hasFoil,
    this.hasNonFoil,
    this.isFullArt,
    this.isFunny,
    this.isOversized,
    this.isPromo,
    this.isReprint,
    this.isTextless,
    this.keywords,
    this.language,
    this.layout,
    this.manaCost,
    this.name,
    this.number,
    this.orientation,
    this.originalText,
    this.originalType,
    this.otherFaceIds,
    this.power,
    this.promoTypes,
    this.relatedCards,
    this.reverseRelated,
    this.securityStamp,
    this.setCode,
    this.side,
    this.signature,
    this.subtypes,
    this.supertypes,
    this.text,
    this.toughness,
    this.type,
    this.types,
    required this.uuid,
    this.watermark,
  });

  static bool? _toBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return null;
  }

  factory TokenModel.fromMap(Map<String, dynamic> map) {
    return TokenModel(
      artist: map['artist'] as String?,
      artistIds: map['artistIds'] as String?,
      asciiName: map['asciiName'] as String?,
      availability: map['availability'] as String?,
      boosterTypes: map['boosterTypes'] as String?,
      borderColor: map['borderColor'] as String?,
      colorIdentity: map['colorIdentity'] as String?,
      colors: map['colors'] as String?,
      edhrecSaltiness: map['edhrecSaltiness'] is num ? (map['edhrecSaltiness'] as num).toDouble() : null,
      faceName: map['faceName'] as String?,
      finishes: map['finishes'] as String?,
      flavorName: map['flavorName'] as String?,
      flavorText: map['flavorText'] as String?,
      frameEffects: map['frameEffects'] as String?,
      frameVersion: map['frameVersion'] as String?,
      hasFoil: _toBool(map['hasFoil']),
      hasNonFoil: _toBool(map['hasNonFoil']),
      isFullArt: _toBool(map['isFullArt']),
      isFunny: _toBool(map['isFunny']),
      isOversized: _toBool(map['isOversized']),
      isPromo: _toBool(map['isPromo']),
      isReprint: _toBool(map['isReprint']),
      isTextless: _toBool(map['isTextless']),
      keywords: map['keywords'] as String?,
      language: map['language'] as String?,
      layout: map['layout'] as String?,
      manaCost: map['manaCost'] as String?,
      name: map['name'] as String?,
      number: map['number'] as String?,
      orientation: map['orientation'] as String?,
      originalText: map['originalText'] as String?,
      originalType: map['originalType'] as String?,
      otherFaceIds: map['otherFaceIds'] as String?,
      power: map['power'] as String?,
      promoTypes: map['promoTypes'] as String?,
      relatedCards: map['relatedCards'] as String?,
      reverseRelated: map['reverseRelated'] as String?,
      securityStamp: map['securityStamp'] as String?,
      setCode: map['setCode'] as String?,
      side: map['side'] as String?,
      signature: map['signature'] as String?,
      subtypes: map['subtypes'] as String?,
      supertypes: map['supertypes'] as String?,
      text: map['text'] as String?,
      toughness: map['toughness'] as String?,
      type: map['type'] as String?,
      types: map['types'] as String?,
      uuid: map['uuid'] as String,
      watermark: map['watermark'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'artist': artist,
      'artistIds': artistIds,
      'asciiName': asciiName,
      'availability': availability,
      'boosterTypes': boosterTypes,
      'borderColor': borderColor,
      'colorIdentity': colorIdentity,
      'colors': colors,
      'edhrecSaltiness': edhrecSaltiness,
      'faceName': faceName,
      'finishes': finishes,
      'flavorName': flavorName,
      'flavorText': flavorText,
      'frameEffects': frameEffects,
      'frameVersion': frameVersion,
      'hasFoil': hasFoil,
      'hasNonFoil': hasNonFoil,
      'isFullArt': isFullArt,
      'isFunny': isFunny,
      'isOversized': isOversized,
      'isPromo': isPromo,
      'isReprint': isReprint,
      'isTextless': isTextless,
      'keywords': keywords,
      'language': language,
      'layout': layout,
      'manaCost': manaCost,
      'name': name,
      'number': number,
      'orientation': orientation,
      'originalText': originalText,
      'originalType': originalType,
      'otherFaceIds': otherFaceIds,
      'power': power,
      'promoTypes': promoTypes,
      'relatedCards': relatedCards,
      'reverseRelated': reverseRelated,
      'securityStamp': securityStamp,
      'setCode': setCode,
      'side': side,
      'signature': signature,
      'subtypes': subtypes,
      'supertypes': supertypes,
      'text': text,
      'toughness': toughness,
      'type': type,
      'types': types,
      'uuid': uuid,
      'watermark': watermark,
    };
  }
}
