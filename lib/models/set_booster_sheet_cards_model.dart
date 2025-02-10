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