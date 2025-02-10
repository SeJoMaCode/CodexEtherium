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