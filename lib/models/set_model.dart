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